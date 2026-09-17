import { Entity } from "../../utils/entity.ts";

export type SellerProps = {
  name: string;
  email: string;
  password: string;
};

export class Seller extends Entity<SellerProps> {
  private constructor(props: SellerProps, id?: string) {
    super(props, { createdAt: new Date(), updatedAt: new Date() }, id);
  }

  static create(props: SellerProps) {
    return new Seller(props);
  }
}
