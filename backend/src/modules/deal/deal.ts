import type {
  DealDTO,
  DealStatus,
  LeadSummary,
  SellerSummary,
} from "@sales/shared";
import { Entity, type Timestamps } from "../../utils/entity.ts";

export type DealProps = {
  description: string | null;
  expectedCloseDate: Date | null;
  leadId: string;
  responsibleId: string;
  status: DealStatus;
  title: string;
  value: number | null;
};

export type DealInput = Omit<DealProps, "expectedCloseDate"> & {
  expectedCloseDate: string | null;
};

function toCalendarDate(value: string | null): Date | null {
  return value === null ? null : new Date(value);
}

function hydrate(props: DealInput): DealProps {
  return {
    ...props,
    expectedCloseDate: toCalendarDate(props.expectedCloseDate),
  };
}

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
  get expectedCloseDate(): Date | null {
    return this.props.expectedCloseDate;
  }

  mutate(props: Partial<DealInput>): Deal {
    const merged: DealInput = {
      description: this.props.description,
      expectedCloseDate: this.props.expectedCloseDate?.toISOString() ?? null,
      leadId: this.props.leadId,
      responsibleId: this.props.responsibleId,
      status: this.props.status,
      title: this.props.title,
      value: this.props.value,
      ...props,
    };

    return new Deal(
      hydrate(merged),
      { createdAt: this.createdAt, updatedAt: new Date() },
      this.id
    );
  }

  toDTO(responsible: SellerSummary, lead: LeadSummary): DealDTO {
    return {
      createdAt: this.createdAt.toISOString(),
      description: this.description,
      expectedCloseDate: this.expectedCloseDate?.toISOString() ?? null,
      id: this.id,
      lead,
      responsible,
      status: this.status,
      title: this.title,
      updatedAt: this.updatedAt.toISOString(),
      value: this.value,
    };
  }

  static create(props: DealInput, id?: string) {
    const now = new Date();
    return new Deal(hydrate(props), { createdAt: now, updatedAt: now }, id);
  }

  static fromPersistence(props: DealInput, id: string, timestamps: Timestamps) {
    return new Deal(hydrate(props), timestamps, id);
  }
}
