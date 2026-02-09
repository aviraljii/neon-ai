import mongoose, { Schema, Document } from 'mongoose';

export interface IQuery extends Document {
  userId: mongoose.Types.ObjectId;
  queryText: string;
  result: {
    productName: string;
    price: number;
    fabric: string;
    comfortLevel: string;
    bestFor: string;
    budgetScore: number;
    verdict: string;
  };
  createdAt: Date;
}

const querySchema = new Schema<IQuery>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    queryText: { type: String, required: true },
    result: {
      productName: { type: String },
      price: { type: Number },
      fabric: { type: String },
      comfortLevel: { type: String },
      bestFor: { type: String },
      budgetScore: { type: Number },
      verdict: { type: String },
    },
  },
  { timestamps: true }
);

export const Query = mongoose.models.Query || mongoose.model<IQuery>('Query', querySchema);
