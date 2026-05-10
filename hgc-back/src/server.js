const app = require("./app");
const { connectPostgres } = require("./config/postgres");
const { initAuthTables } = require("./config/init-auth-tables");
const { initChatTables } = require("./config/init-chat-tables");
const { port } = require("./config/env");

const start = async () => {
    try {
        await connectPostgres();
        await initAuthTables();
        await initChatTables();

        app.listen(port, () => {
            console.log(`Server running on http://localhost:${port}`);
        });
    } catch (err) {
        console.error("Error starting server:", err);
        process.exit(1);
    }
};

start();