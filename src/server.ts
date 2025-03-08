import { app } from "./app";
import { ENV } from "./config/env";

app.listen(ENV.PORT, () => {
	console.log(`Servidor rodando em http://localhost:${ENV.PORT}`);
});
