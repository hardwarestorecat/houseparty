import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IOTP extends Document {
  user: mongoose.Types.ObjectId;
  type: 'email' | 'phone';
  code: string;
  expiresAt: Date;
  isUsed: boolean;
  createdAt: Date;
  updatedAt: Date;
  compareCode(candidateCode: string): Promise<boolean>;
}

const OTPSchema = new Schema<IOTP>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['email', 'phone'],
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: function() {
        // Default expiration: 10 minutes from creation
        return new Date(Date.now() + 10 * 60 * 1000);
      },
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Hash OTP code before saving
OTPSchema.pre('save', async function (next) {
  if (!this.isModified('code')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.code = await bcrypt.hash(this.code, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare OTP code method
OTPSchema.methods.compareCode = async function (
  candidateCode: string
): Promise<boolean> {
  return bcrypt.compare(candidateCode, this.code);
};

// Create indexes
OTPSchema.index({ user: 1, type: 1 });
OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<IOTP>('OTP', OTPSchema);

