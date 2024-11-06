import { PrismaClient } from "@prisma/client";

declare global {
    // eslint-disable-next-line no-var
    var db: PrismaClient | undefined;
}

export const prisma = global.db || new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});

if (process.env.NODE_ENV !== "production") {
    global.db = prisma;
}

process.on("beforeExit", async () => {
    await prisma.$disconnect();
});
