"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const client_1 = require("@prisma/client");
let db;
// Optimized database configuration with proper connection pooling for Supabase
const prismaOptions = {
    log: process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
};
if (process.env.NODE_ENV === "production") {
    // Production: Use connection pooling with proper configuration for Supabase
    exports.db = db = new client_1.PrismaClient({
        ...prismaOptions,
        datasources: {
            db: {
                url: process.env.DATABASE_URL, // Use DIRECT_URL for migrations
            },
        },
    });
    // Configure connection pool limits for better performance
    db.$connect()
        .then(() => {
        console.log("✅ Database connected successfully");
    })
        .catch((error) => {
        console.error("❌ Database connection failed:", error);
    });
}
else {
    // Development: Use global instance to prevent multiple connections
    if (!global.__db__) {
        global.__db__ = new client_1.PrismaClient({
            ...prismaOptions,
            datasources: {
                db: {
                    url: process.env.DATABASE_URL,
                },
            },
        });
    }
    exports.db = db = global.__db__;
}
// Handle graceful shutdown
async function disconnect() {
    await db.$disconnect();
}
process.on("SIGINT", disconnect);
process.on("SIGTERM", disconnect);
process.on("beforeExit", disconnect);
//# sourceMappingURL=database.js.map