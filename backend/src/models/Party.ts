import mongoose, { Document, Schema } from 'mongoose';

export interface IParty extends Document {
  host: mongoose.Types.ObjectId;
  participants: mongoose.Types.ObjectId[];
  maxParticipants: number;
  isActive: boolean;
  startTime: Date;
  endTime?: Date;
  agoraChannel: string;
  createdAt: Date;
  updatedAt: Date;
}

const PartySchema = new Schema<IParty>(
  {
    host: {
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
    maxParticipants: {
      type: Number,
      default: 10,
      min: [2, 'A party must have at least 2 participants'],
      max: [10, 'A party cannot have more than 10 participants'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: {
      type: Date,
    },
    agoraChannel: {
      type: String,
      required: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes
PartySchema.index({ host: 1 });
PartySchema.index({ isActive: 1 });
PartySchema.index({ agoraChannel: 1 }, { unique: true });

export default mongoose.model<IParty>('Party', PartySchema);

