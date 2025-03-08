const { knex } = require("../../config/database");

export async function adicionarCliente(
	nome_cliente: string,
	telefone: string,
	tipo_cliente: string,
) {
	const [cliente_id] = await knex("cliente").insert({
		Nome_Cliente: nome_cliente,
		Telefone: telefone,
		Tipo_Cliente: tipo_cliente,
	});
	return cliente_id;
}
