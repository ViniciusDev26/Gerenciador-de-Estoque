const { knex } = require("../../config/database");

async function adicionarProduto(nome_produto, quantidade_total, preco, custo) {
	const result = await knex("estoque").insert({
		nome_produto,
		quantidade_total,
		preco,
		custo,
	});

	return result;
}

module.exports = { adicionarProduto };
