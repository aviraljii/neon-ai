import mongoose, { Schema, Document } from 'mongoose';

export interface IPost extends Document {
  image: string;
  title: string;
  link: string;
  userId: string;
  createdAt: Date;
}

const postSchema = new Schema<IPost>(
  {
    image: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    link: { type: String, required: true, trim: true },
    userId: { type: String, required: true, trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Post = mongoose.models.Post || mongoose.model<IPost>('Post', postSchema);
