import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const result: any = await prisma.$queryRaw`SELECT @@character_set_database, @@collation_database;`;
  console.log("Database default:", result);
  
  const columns: any = await prisma.$queryRaw`
    SELECT TABLE_NAME, COLUMN_NAME, COLLATION_NAME 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'Message' AND COLUMN_NAME = 'content';
  `;
  console.log("Column collation:", columns);
}
main().catch(console.error).finally(() => prisma.$disconnect());
