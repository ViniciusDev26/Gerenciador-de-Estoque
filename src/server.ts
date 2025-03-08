import { app } from "./app";
import { ENV } from "./config/env";
import { logger } from "./config/pino";

app.listen(ENV.PORT, () => {
	logger.info(`Servidor rodando em http://localhost:${ENV.PORT}`);
});
