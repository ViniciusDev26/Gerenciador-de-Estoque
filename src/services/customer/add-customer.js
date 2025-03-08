const { knex } = require("../../config/database");

async function adicionarCliente(nome_cliente, telefone, tipo_cliente) {
	const [cliente_id] = await knex("cliente").insert({
		Nome_Cliente: nome_cliente,
		Telefone: telefone,
		Tipo_Cliente: tipo_cliente,
	});
	return cliente_id;
}

module.exports = { adicionarCliente };
