import { prisma } from "../src/db";
import { randomBytes } from "node:crypto";

async function main() {
  const token = randomBytes(32).toString("hex");
  const { id } = await prisma.apiToken.create({
    data: {
      tokenHash: await Bun.password.hash(token),
    },
  });

  console.log("x-api-id: ", id);
  console.log("x-api-secret: ", token);
}

main();
