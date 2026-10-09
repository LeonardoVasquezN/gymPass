
const { PrismaClient } = require("@prisma/client");

async function probar(nombre, url) {
  const prisma = new PrismaClient({
    datasources: {
      db: { url },
    },
  });

  try {
    console.log(`\n--- ${nombre} ---`);

    await prisma.$connect();

    for (let i = 1; i <= 5; i++) {
      const inicio = performance.now();

      await prisma.$queryRaw`SELECT 1`;

      console.log(
        `Consulta ${i}: ${(performance.now() - inicio).toFixed(0)} ms`
      );
    }
  } catch (error) {
    console.error(`${nombre}: error de conexión`, error.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  await probar("Transaction pooler", process.env.DATABASE_URL);
  await probar("Session pooler", process.env.DIRECT_URL);
}

main().catch(console.error);