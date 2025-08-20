import mongoose, { Document, Schema } from 'mongoose';

export interface IInvitation extends Document {
  sender: mongoose.Types.ObjectId;
  recipient: mongoose.Types.ObjectId;
  party: mongoose.Types.ObjectId;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InvitationSchema = new Schema<IInvitation>(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    party: {
      type: Schema.Types.ObjectId,
      ref: 'Party',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'expired'],
      default: 'pending',
    },
    expiresAt: {
      type: Date,
      required: true,
      default: function() {
        // Default expiration: 1 hour from creation
        return new Date(Date.now() + 60 * 60 * 1000);
      },
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes
InvitationSchema.index({ sender: 1, recipient: 1, party: 1 }, { unique: true });
InvitationSchema.index({ recipient: 1, status: 1 });
InvitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<IInvitation>('Invitation', InvitationSchema);

