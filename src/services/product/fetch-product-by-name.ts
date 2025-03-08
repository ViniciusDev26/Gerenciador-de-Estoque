import { knex } from "../../config/database";
import { logger } from "../../config/pino";

export async function buscarProduto(nome_produto: string) {
	const data = await knex("estoque")
		.select("*")
		.where("nome_produto", "like", `%${nome_produto}%`);
	logger.info("Dados do produto encontrados:", data);
	return data;
}
