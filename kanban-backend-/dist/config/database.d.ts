import { PrismaClient } from "@prisma/client";
declare global {
    var __db__: PrismaClient | undefined;
}
declare let db: PrismaClient;
export { db };
//# sourceMappingURL=database.d.ts.map