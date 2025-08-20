import mongoose, { Document, Schema } from 'mongoose';

export interface IParty extends Document {
  name: string;
  hostId: mongoose.Types.ObjectId;
  participants: mongoose.Types.ObjectId[];
  channelName: string;
  isActive: boolean;
  maxParticipants: number;
  createdAt: Date;
  updatedAt: Date;
}

const PartySchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    hostId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    channelName: {
      type: String,
      required: true,
      unique: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    maxParticipants: {
      type: Number,
      default: 10,
      min: 2,
      max: 10,
    },
  },
  {
    timestamps: true,
  }
);

// Create a compound index for efficient queries
PartySchema.index({ isActive: 1, createdAt: -1 });

export default mongoose.model<IParty>('Party', PartySchema);

