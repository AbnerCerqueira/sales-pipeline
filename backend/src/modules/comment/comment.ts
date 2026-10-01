import type { CommentDTO, SellerSummary } from "@sales/shared";
import { Entity, type Timestamps } from "../../utils/entity.ts";

export type CommentProps = {
  content: string;
  dealId: string;
  sellerId: string;
};

export class Comment extends Entity<CommentProps> {
  private constructor(
    props: CommentProps,
    timestamps: Timestamps,
    id?: string
  ) {
    super(props, timestamps, id);
  }

  get content(): string {
    return this.props.content;
  }
  get dealId(): string {
    return this.props.dealId;
  }
  get sellerId(): string {
    return this.props.sellerId;
  }

  toDTO(seller: SellerSummary): CommentDTO {
    return {
      content: this.content,
      createdAt: this.createdAt.toISOString(),
      dealId: this.dealId,
      id: this.id,
      seller,
    };
  }

  static create(props: CommentProps, id?: string) {
    const now = new Date();
    return new Comment(props, { createdAt: now, updatedAt: now }, id);
  }

  static fromPersistence(
    props: CommentProps,
    id: string,
    timestamps: Timestamps
  ) {
    return new Comment(props, timestamps, id);
  }
}
