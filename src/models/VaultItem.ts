// src/models/VaultItem.ts
import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface IVaultItem extends Document {
  userId: Types.ObjectId;
  title: string;
  username: string;
  ciphertext: string;
  iv: string;
  salt: string;
  url?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const VaultItemSchema: Schema<IVaultItem> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    username: { type: String, required: true },
    ciphertext: { type: String, required: true },
    iv: { type: String, required: true },
    salt: { type: String, required: true },
    url: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

const VaultItem: Model<IVaultItem> = mongoose.models.VaultItem || mongoose.model<IVaultItem>('VaultItem', VaultItemSchema);

export default VaultItem;
