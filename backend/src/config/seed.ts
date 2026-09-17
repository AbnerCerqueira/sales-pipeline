import { eq } from "drizzle-orm";
import { uuidv7 } from "uuidv7";
import { db } from "../config/db.ts";
import { BcryptPasswordHasher } from "../lib/bcrypt-password-hasher.ts";
import { sellersTable } from "../modules/seller/persistence/seller-table.ts";

const DEFAULT_SELLER = {
  email: "john@example.com",
  name: "John Doe",
  password: "123456",
};

async function seed() {
  const existing = await db
    .select()
    .from(sellersTable)
    .where(eq(sellersTable.email, DEFAULT_SELLER.email))
    .limit(1);

  if (existing.length > 0) {
    console.log("Seed user already exists, skipping.");
    return;
  }

  const hasher = new BcryptPasswordHasher();
  const hashedPassword = await hasher.hash(DEFAULT_SELLER.password);

  await db.insert(sellersTable).values({
    createdAt: new Date(),
    email: DEFAULT_SELLER.email,
    id: uuidv7(),
    name: DEFAULT_SELLER.name,
    password: hashedPassword,
    updatedAt: new Date(),
  });

  console.log("Seed user created successfully.");
  console.log(`Email: ${DEFAULT_SELLER.email}`);
  console.log(`Password: ${DEFAULT_SELLER.password}`);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
