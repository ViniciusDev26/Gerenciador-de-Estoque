const ENV = {
	DATABASE: {
		HOST: process.env.DB_HOST ?? "localhost",
		PORT: process.env.DB_PORT ?? 3306,
		USER: process.env.DB_USER ?? "root",
		PASSWORD: process.env.PASSWORD,
		NAME: process.env.DB_NAME,
		DEBUG_MODE: process.env.DB_DEBUG ?? false,
	},
	PORT: process.env.PORT ?? 5051,
};

module.exports = { ENV };
