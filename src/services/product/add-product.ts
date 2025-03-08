const { knex } = require("../../config/database");

export async function adicionarProduto(
	nome_produto: string,
	quantidade_total: number,
	preco: number,
	custo: number,
) {
	const result = await knex("estoque").insert({
		nome_produto,
		quantidade_total,
		preco,
		custo,
	});

	return result;
}
