import mongoose, { Schema, Document } from 'mongoose';

export interface IProductPlatform {
  platformName: string;
  price: number;
  rating: number;
  affiliateLink: string;
}

export interface IProduct extends Document {
  name?: string;
  description?: string;
  image?: string;
  platforms?: IProductPlatform[];
  title: string;
  price: number;
  fabric: string;
  category: string;
  sourceLink: string;
  createdAt: Date;
}

const productPlatformSchema = new Schema<IProductPlatform>(
  {
    platformName: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    rating: { type: Number, required: true, min: 0, max: 5 },
    affiliateLink: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const productSchema = new Schema<IProduct>(
  {
    // Existing fields kept for backward compatibility
    title: { type: String, required: false },
    price: { type: Number, required: false },
    fabric: { type: String, required: false },
    sourceLink: { type: String, required: false },

    // New comparison-system fields
    name: { type: String, required: false, trim: true },
    description: { type: String, required: false, trim: true },
    image: { type: String, required: false, trim: true },
    category: { type: String, required: true, trim: true },
    platforms: { type: [productPlatformSchema], default: [] },
  },
  { timestamps: true }
);

export const Product = mongoose.models.Product || mongoose.model<IProduct>('Product', productSchema);
