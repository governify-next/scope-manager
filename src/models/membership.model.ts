import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMembership extends Document {
    organizationId: Types.ObjectId;
    userId: Types.ObjectId;
    rolesId: Types.ObjectId[];
}

const membershipSchema = new Schema<IMembership>(
    {
        organizationId: { type: Schema.Types.ObjectId, required: true, ref: 'Organization' },
        userId: { type: Schema.Types.ObjectId, required: true },
        rolesId: {
            type: [Schema.Types.ObjectId],
            default: [],
        },
    },
    { timestamps: true },
);

// Uniqueness index
membershipSchema.index({ organizationId: 1, userId: 1 }, { unique: true });

// Index to know which users have which roles in an org
membershipSchema.index({ organizationId: 1, rolesId: 1 });

// Index to find the organizations a user belongs to
membershipSchema.index({ userId: 1 });

const Membership = mongoose.model<IMembership>('Membership', membershipSchema);
export default Membership;
