import bcrypt from "bcrypt";
import { env } from "../config/envs.ts";
import type { PasswordHasher } from "../modules/seller/password-hasher.ts";

const SALT_ROUNDS = 12;

export class BcryptPasswordHasher implements PasswordHasher {
  async compare(password: string, hashedPassword: string) {
    return await bcrypt.compare(password, hashedPassword);
  }

  async hash(password: string) {
    return await bcrypt.hash(
      password,
      env.NODE_ENV === "test" ? 0 : SALT_ROUNDS
    );
  }
}
