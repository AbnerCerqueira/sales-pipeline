import type { SellerDTO } from "@sales/shared";
import { Entity, type Timestamps } from "../../utils/entity.ts";

export type SellerProps = {
  name: string;
  email: string;
  password: string;
};

export class Seller extends Entity<SellerProps> {
  private constructor(props: SellerProps, timestamps: Timestamps, id?: string) {
    super(props, timestamps, id);
  }

  get email(): string {
    return this.props.email;
  }

  get name(): string {
    return this.props.name;
  }

  get password(): string {
    return this.props.password;
  }

  toDTO(): SellerDTO {
    return {
      createdAt: this.createdAt,
      email: this.email,
      id: this.id,
      name: this.name,
      updatedAt: this.updatedAt,
    };
  }

  static create(props: SellerProps, id?: string) {
    const now = new Date();
    return new Seller(props, { createdAt: now, updatedAt: now }, id);
  }

  static fromPersistence(
    props: SellerProps,
    id: string,
    timestamps: Timestamps
  ) {
    return new Seller(props, timestamps, id);
  }
}
