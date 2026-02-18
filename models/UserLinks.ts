import mongoose, { Schema, Document } from 'mongoose';

export interface IUserLinkItem {
  _id?: mongoose.Types.ObjectId;
  title: string;
  url: string;
}

export interface IUserLinks extends Document {
  username: string;
  userId?: string;
  links: IUserLinkItem[];
  createdAt: Date;
  updatedAt: Date;
}

const userLinkItemSchema = new Schema<IUserLinkItem>(
  {
    title: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
  },
  { _id: true }
);

const userLinksSchema = new Schema<IUserLinks>(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    userId: { type: String, required: false, trim: true },
    links: { type: [userLinkItemSchema], default: [] },
  },
  { timestamps: true }
);

export const UserLinks =
  mongoose.models.UserLinks || mongoose.model<IUserLinks>('UserLinks', userLinksSchema);
