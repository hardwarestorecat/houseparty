import mongoose, { Document, Schema } from 'mongoose';

export interface IInvitation extends Document {
  senderId: mongoose.Types.ObjectId;
  receiverId?: mongoose.Types.ObjectId;
  receiverPhone?: string;
  receiverEmail?: string;
  partyId?: mongoose.Types.ObjectId;
  type: string; // 'party' | 'friend'
  status: string; // 'pending' | 'accepted' | 'declined'
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InvitationSchema: Schema = new Schema(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    receiverPhone: {
      type: String,
      trim: true,
    },
    receiverEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    partyId: {
      type: Schema.Types.ObjectId,
      ref: 'Party',
    },
    type: {
      type: String,
      required: true,
      enum: ['party', 'friend'],
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'accepted', 'declined'],
      default: 'pending',
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for efficient queries
InvitationSchema.index({ senderId: 1, status: 1 });
InvitationSchema.index({ receiverId: 1, status: 1 });
InvitationSchema.index({ receiverPhone: 1, status: 1 });
InvitationSchema.index({ receiverEmail: 1, status: 1 });
InvitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for automatic deletion

export default mongoose.model<IInvitation>('Invitation', InvitationSchema);

