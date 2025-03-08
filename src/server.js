const express = require("express");
const cors = require("cors");

const knex = require("knex")({
	client: "mysql2",
	connection: {
		host: process.env.DB_HOST,
		port: process.env.DB_PORT,
		user: process.env.DB_USER,
		password: process.env.DB_PASS,
		database: process.env.DB_NAME,
	},
	debug: true, // Habilita o modo de depuração
});

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Função para adicionar um produto ao banco de dados
async function adicionarProduto(nome_produto, quantidade_total, preco, custo) {
	const result = await knex("estoque").insert({
		nome_produto,
		quantidade_total,
		preco,
		custo,
	});
	return result;
}

// Rota para lidar com a submissão de formulário para adicionar um produto
app.post("/adicionar-produto", async (req, res) => {
	const { nome_produto, quantidade_total, preco, custo } = req.body;

	if (!nome_produto || !quantidade_total || !preco || !custo) {
		return res.status(400).json({ error: "Todos os campos são obrigatórios" });
	}

	try {
		await adicionarProduto(nome_produto, quantidade_total, preco, custo);
		res.status(201).json({ message: "Produto adicionado com sucesso" });
	} catch (error) {
		console.error("Erro ao adicionar produto:", error.message);
		res.status(500).json({ error: "Erro ao adicionar produto" });
	}
});

// Função para buscar um produto no banco de dados
async function buscarProduto(nome_produto) {
	const data = await knex("estoque")
		.select("*")
		.where("nome_produto", "like", `%${nome_produto}%`);
	console.log("Dados do produto encontrados:", data);
	return data;
}

// Rota para lidar com a busca de produto
app.get("/buscar-produto", async (req, res) => {
	const { nome_produto } = req.query;

	if (!nome_produto) {
		return res
			.status(400)
			.json({ error: 'O parâmetro "nome_produto" é obrigatório' });
	}

	try {
		const data = await buscarProduto(nome_produto);
		if (data.length === 0) {
			console.log("Nenhum produto encontrado");
			return res.status(404).json({ error: "Produto não encontrado" });
		}
		console.log("Produtos encontrados:", data);
		res.status(200).json(data);
	} catch (err) {
		console.error("Erro ao buscar produto:", err.message);
		res.status(500).json({ error: "Erro ao buscar produto" });
	}
});

// Função para adicionar um cliente ao banco de dados
async function adicionarCliente(nome_cliente, telefone, tipo_cliente) {
	const [cliente_id] = await knex("cliente").insert({
		Nome_Cliente: nome_cliente,
		Telefone: telefone,
		Tipo_Cliente: tipo_cliente,
	});
	return cliente_id;
}

async function adicionarVenda(
	nome_cliente,
	telefone,
	valor_total,
	metodo_pagamento,
	tipo_cliente,
	taxa_entrega,
	produtosSelecionados,
) {
	const data_venda = new Date().toISOString().slice(0, 10);
	const trx = await knex.transaction();

	try {
		// Adicionar cliente
		const cliente_id = await adicionarCliente(
			nome_cliente,
			telefone,
			tipo_cliente,
		);

		let lucro_produto = 0;

		// Inserir a venda
		const [vendaId] = await trx("Venda").insert({
			Cliente_ID: cliente_id,
			Data_Venda: data_venda,
			Valor_Total: valor_total,
			Lucro_Produto: lucro_produto,
			Metodo_Pagamento: metodo_pagamento,
			Nome_cliente: nome_cliente,
			Taxa_Entrega: taxa_entrega,
			Tipo_Cliente: tipo_cliente,
		});

		// Preparar itens vendidos
		const itemVendaValues = produtosSelecionados.map((produto) => {
			const preco = Number.parseFloat(produto.Preco);
			const custo = Number.parseFloat(produto.Custo);
			const quantidade = Number.parseInt(produto.quantidadeSelecionada, 10);

			if (
				Number.isNaN(preco) ||
				Number.isNaN(custo) ||
				Number.isNaN(quantidade)
			) {
				throw new Error(
					`Dados inválidos para o produto ${produto.Nome_Produto}`,
				);
			}

			const lucroUnitario = (preco - custo) * quantidade;
			lucro_produto += lucroUnitario;

			return {
				Venda_ID: vendaId,
				Produto_ID: produto.Produto_ID,
				Quantidade_Vendida: quantidade,
				Preco_Unitario: preco,
				Data_Pedido: data_venda,
			};
		});

		// Atualizar o lucro total da venda
		await trx("Venda")
			.where("Venda_ID", vendaId)
			.update({ Lucro_Produto: lucro_produto });

		// Inserir os itens vendidos
		await trx("Item_Venda").insert(itemVendaValues);

		// Atualizar o estoque
		for (const produto of produtosSelecionados) {
			await trx("Estoque")
				.where("Produto_ID", produto.Produto_ID)
				.decrement("Quantidade_Total", produto.quantidadeSelecionada);
		}

		// Confirmar a transação
		await trx.commit();

		return { vendaId, produtos: produtosSelecionados };
	} catch (error) {
		await trx.rollback();
		throw new Error(`Erro ao registrar a venda: ${error.message}`);
	}
}

// Rota para registrar uma venda
app.post("/registrar-venda", async (req, res) => {
	const {
		nome_cliente,
		telefone,
		metodo_pagamento,
		tipo_cliente,
		taxa_entrega,
		valor_total,
		produtos,
	} = req.body;

	if (
		!nome_cliente ||
		!telefone ||
		!valor_total ||
		!metodo_pagamento ||
		!tipo_cliente ||
		!produtos ||
		produtos.length === 0
	) {
		return res.status(400).json({
			error: "Todos os campos são obrigatórios, incluindo os produtos",
		});
	}

	try {
		const result = await adicionarVenda(
			nome_cliente,
			telefone,
			valor_total,
			metodo_pagamento,
			tipo_cliente,
			taxa_entrega,
			produtos,
		);
		res.status(200).json({
			message: "Venda registrada com sucesso",
			vendaId: result.vendaId,
			produtosVendidos: result.produtos,
		});
	} catch (error) {
		console.error("Erro ao registrar venda:", error.message);
		res
			.status(500)
			.json({ error: "Erro ao registrar venda", message: error.message });
	}
});

// Rota para buscar vendas no banco de dados
app.get("/buscar-vendas", async (req, res) => {
	try {
		const vendas = await knex("venda")
			.select(
				"Venda_ID",
				"Nome_cliente",
				"Cliente_ID",
				knex.raw("DATE(Data_Venda) as Data_Venda"),
				"Valor_Total",
				"Lucro_Produto",
				"Metodo_Pagamento",
				"Taxa_Entrega",
				"Tipo_Cliente",
			)
			.orderBy("Data_Venda", "desc");

		console.log("Vendas encontradas:", vendas);
		res.status(200).json(vendas);
	} catch (error) {
		console.error("Erro ao buscar vendas:", error.message);
		res.status(500).json({ error: "Erro ao buscar vendas" });
	}
});

const PORT = process.env.PORT || 5051;
app.listen(PORT, () => {
	console.log(`Servidor rodando em http://localhost:${PORT}`);
});
