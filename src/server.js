const { ENV } = require("./config/env");
const { app } = require("./app");

app.listen(ENV.PORT, () => {
	console.log(`Servidor rodando em http://localhost:${ENV.PORT}`);
});
