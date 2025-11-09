import { PrismaClient, Prisma } from "@prisma/client";

declare global {
  var __db__: PrismaClient | undefined;
}

let db: PrismaClient;

// Optimized database configuration with proper connection pooling for Supabase
const prismaOptions: Prisma.PrismaClientOptions = {
  log:
    process.env.NODE_ENV === "development"
      ? (["error", "warn"] as Prisma.LogLevel[])
      : (["error"] as Prisma.LogLevel[]),
};

if (process.env.NODE_ENV === "production") {
  // Production: Use connection pooling with proper configuration for Supabase
  db = new PrismaClient({
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
} else {
  // Development: Use global instance to prevent multiple connections
  if (!global.__db__) {
    global.__db__ = new PrismaClient({
      ...prismaOptions,
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
  }
  db = global.__db__;
}

// Handle graceful shutdown
async function disconnect() {
  await db.$disconnect();
}

process.on("SIGINT", disconnect);
process.on("SIGTERM", disconnect);
process.on("beforeExit", disconnect);

export { db };
