const { knex } = require("../../config/database");
const { adicionarCliente } = require("../customer/add-customer");

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

module.exports = { adicionarVenda };
