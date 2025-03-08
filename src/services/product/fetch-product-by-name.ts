const { knex } = require("../../config/database");

export async function buscarProduto(nome_produto: string) {
	const data = await knex("estoque")
		.select("*")
		.where("nome_produto", "like", `%${nome_produto}%`);
	console.log("Dados do produto encontrados:", data);
	return data;
}
