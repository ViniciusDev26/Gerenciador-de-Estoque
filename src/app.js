const express = require("express");
const cors = require("cors");
const { adicionarProduto } = require("./services/product/add-product");
const { buscarProduto } = require("./services/product/fetch-product-by-name");
const { listSails } = require("./services/sale/list-sails");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

app.get("/buscar-vendas", async (req, res) => {
	try {
		const vendas = listSails();

		console.log("Vendas encontradas:", vendas);
		res.status(200).json(vendas);
	} catch (error) {
		console.error("Erro ao buscar vendas:", error.message);
		res.status(500).json({ error: "Erro ao buscar vendas" });
	}
});

module.exports = { app };
