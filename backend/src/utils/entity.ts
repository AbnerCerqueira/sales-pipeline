import { uuidv7 } from "uuidv7";

export type Timestamps = {
  createdAt: Date;
  updatedAt: Date;
};

export abstract class Entity<Props> {
  protected _id: string;
  protected props: Props & Timestamps;

  protected constructor(props: Props, timestamps: Timestamps, id?: string) {
    this._id = id ?? uuidv7();
    this.props = {
      ...props,
      ...timestamps,
    };
  }

  get id(): string {
    return this._id;
  }

  get createdAt(): Date {
    return new Date(this.props.createdAt.getTime());
  }

  get updatedAt(): Date {
    return new Date(this.props.updatedAt.getTime());
  }
}
