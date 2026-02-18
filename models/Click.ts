import mongoose, { Schema, Document } from 'mongoose';

export interface IClick extends Document {
  productId: string;
  platform: string;
  timestamp: Date;
}

const clickSchema = new Schema<IClick>(
  {
    productId: { type: String, required: true, trim: true },
    platform: { type: String, required: true, trim: true },
    timestamp: { type: Date, required: true, default: Date.now },
  },
  { timestamps: false }
);

export const Click = mongoose.models.Click || mongoose.model<IClick>('Click', clickSchema);
