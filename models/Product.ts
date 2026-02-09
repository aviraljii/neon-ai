import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  title: string;
  price: number;
  fabric: string;
  category: string;
  sourceLink: string;
  createdAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    title: { type: String, required: true },
    price: { type: Number, required: true },
    fabric: { type: String, required: true },
    category: { type: String, required: true },
    sourceLink: { type: String, required: true },
  },
  { timestamps: true }
);

export const Product = mongoose.models.Product || mongoose.model<IProduct>('Product', productSchema);
