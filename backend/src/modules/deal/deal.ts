import type {
  DealDTO,
  DealStatus,
  LeadSummary,
  SellerSummary,
} from "@sales/shared";
import { Entity, type Timestamps } from "../../utils/entity.ts";

export type DealProps = {
  description: string | null;
  expectedCloseDate: string | null;
  leadId: string;
  responsibleId: string;
  status: DealStatus;
  title: string;
  value: number | null;
};

export class Deal extends Entity<DealProps> {
  private constructor(props: DealProps, timestamps: Timestamps, id?: string) {
    super(props, timestamps, id);
  }

  get title(): string {
    return this.props.title;
  }
  get leadId(): string {
    return this.props.leadId;
  }
  get responsibleId(): string {
    return this.props.responsibleId;
  }
  get status(): DealStatus {
    return this.props.status;
  }
  get value(): number | null {
    return this.props.value;
  }
  get description(): string | null {
    return this.props.description;
  }
  get expectedCloseDate(): string | null {
    return this.props.expectedCloseDate;
  }

  toDTO(responsible: SellerSummary, lead: LeadSummary): DealDTO {
    return {
      createdAt: this.createdAt,
      description: this.description,
      expectedCloseDate: this.expectedCloseDate,
      id: this.id,
      lead,
      responsible,
      status: this.status,
      title: this.title,
      updatedAt: this.updatedAt,
      value: this.value,
    };
  }

  static create(props: DealProps, id?: string) {
    const now = new Date();
    return new Deal(props, { createdAt: now, updatedAt: now }, id);
  }

  static fromPersistence(props: DealProps, id: string, timestamps: Timestamps) {
    return new Deal(props, timestamps, id);
  }
}
