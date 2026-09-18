import { db } from "../../config/db.ts";
import { DrizzleLeadRepository } from "./persistence/drizzle/drizzle-lead-repository.ts";

export const leadRepository = new DrizzleLeadRepository(db);
