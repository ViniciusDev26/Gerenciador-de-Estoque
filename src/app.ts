import cors from "cors";
import express from "express";
import morgan from "morgan";
import { logger } from "./config/pino";
import { adicionarProduto } from "./services/product/add-product";
import { buscarProduto } from "./services/product/fetch-product-by-name";
import { listSails } from "./services/sale/list-sails";
import { adicionarVenda } from "./services/sale/make-sale";

export const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.post("/adicionar-produto", async (req, res) => {
	const { nome_produto, quantidade_total, preco, custo } = req.body;

	if (!nome_produto || !quantidade_total || !preco || !custo) {
		return res.status(400).json({ error: "Todos os campos são obrigatórios" });
	}

	try {
		await adicionarProduto(nome_produto, quantidade_total, preco, custo);
		res.status(201).json({ message: "Produto adicionado com sucesso" });
	} catch (error) {
		const err = error as Error;
		logger.error("Erro ao adicionar produto:", err.message);
		res.status(500).json({ error: "Erro ao adicionar produto" });
	}
});

app.get("/buscar-produto", async (req, res) => {
	const { nome_produto } = req.query;

	if (!nome_produto) {
		return res
			.status(400)
			.json({ error: 'O parâmetro "nome_produto" é obrigatório' });
	}

	try {
		const data = await buscarProduto(nome_produto as string);
		if (data.length === 0) {
			logger.info("Nenhum produto encontrado");
			return res.status(404).json({ error: "Produto não encontrado" });
		}
		logger.info("Produtos encontrados:", data);
		res.status(200).json(data);
	} catch (error) {
		const err = error as Error;
		logger.error("Erro ao buscar produto:", err.message);
		res.status(500).json({ error: "Erro ao buscar produto" });
	}
});

app.get("/buscar-vendas", async (req, res) => {
	try {
		const vendas = listSails();

		logger.info("Vendas encontradas:", vendas);
		res.status(200).json(vendas);
	} catch (error) {
		const err = error as Error;
		logger.error("Erro ao buscar vendas:", err.message);
		res.status(500).json({ error: "Erro ao buscar vendas" });
	}
});

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
		const err = error as Error;
		logger.error("Erro ao registrar venda:", err.message);
		res
			.status(500)
			.json({ err: "Erro ao registrar venda", message: err.message });
	}
});
