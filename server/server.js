const { app, saveFacts } = require("./app");

saveFacts();
app.listen(8080);

console.log("Webpage now being hosted on http://localhost:8080");
