const { knex } = require("../../config/database");

export async function listSails() {
	const sails = await knex("venda")
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

	return sails;
}
