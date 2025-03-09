const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function fetchAllInvoices() {
  try {
    const invoices = await prisma.invoice.findMany({
      orderBy: { createdAt: "desc" }, // Sort by newest first
    });

    console.log("All Invoices:", invoices);
    return invoices;
  } catch (error) {
    console.error("Error fetching invoices:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run function
fetchAllInvoices();