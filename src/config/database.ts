import knex_db from "knex";
import { ENV } from "./env";

export const knex = knex_db({
	client: "mysql2",
	connection: {
		host: ENV.DATABASE.HOST,
		port: ENV.DATABASE.PORT,
		user: ENV.DATABASE.USER,
		password: ENV.DATABASE.PASSWORD,
		database: ENV.DATABASE.NAME,
	},
	debug: ENV.DATABASE.DEBUG_MODE, // Habilita o modo de depuração
});
