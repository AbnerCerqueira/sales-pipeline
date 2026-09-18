import type { LeadDTO, LeadResponsible, LeadSource } from "@sales/shared";
import { Entity, type Timestamps } from "../../utils/entity.ts";

export type LeadProps = {
  companyName: string;
  description: string;
  email: string;
  fullName: string;
  location: string;
  responsibleId: string;
  source: LeadSource;
  whatsapp: string;
};

export class Lead extends Entity<LeadProps> {
  private constructor(props: LeadProps, timestamps: Timestamps, id?: string) {
    super(props, timestamps, id);
  }

  get fullName(): string {
    return this.props.fullName;
  }

  get companyName(): string {
    return this.props.companyName;
  }

  get email(): string {
    return this.props.email;
  }

  get whatsapp(): string {
    return this.props.whatsapp;
  }

  get location(): string {
    return this.props.location;
  }

  get source(): LeadSource {
    return this.props.source;
  }

  get description(): string {
    return this.props.description;
  }

  get responsibleId(): string {
    return this.props.responsibleId;
  }

  toDTO(responsible: LeadResponsible): LeadDTO {
    return {
      companyName: this.companyName,
      createdAt: this.createdAt,
      description: this.description,
      email: this.email,
      fullName: this.fullName,
      id: this.id,
      location: this.location,
      responsible,
      responsibleId: this.responsibleId,
      source: this.source,
      updatedAt: this.updatedAt,
      whatsapp: this.whatsapp,
    };
  }

  static create(props: LeadProps, id?: string) {
    const now = new Date();
    return new Lead(props, { createdAt: now, updatedAt: now }, id);
  }

  static fromPersistence(props: LeadProps, id: string, timestamps: Timestamps) {
    return new Lead(props, timestamps, id);
  }
}
