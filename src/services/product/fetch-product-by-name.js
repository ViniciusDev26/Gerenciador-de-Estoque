const { knex } = require("../../config/database");

async function buscarProduto(nome_produto) {
	const data = await knex("estoque")
		.select("*")
		.where("nome_produto", "like", `%${nome_produto}%`);
	console.log("Dados do produto encontrados:", data);
	return data;
}

module.exports = { buscarProduto };
