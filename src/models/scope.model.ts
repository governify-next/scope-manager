import mongoose, { Schema, Types } from 'mongoose';

// TypeScript Interface

export interface IScope {
    _id: Types.ObjectId;
    name: string;
    description?: string;
    type: string;
    organizationId: Types.ObjectId;
    parentId?: Types.ObjectId;
    permissions: {
        view: Types.ObjectId[];
        edit: Types.ObjectId[];
        delete: Types.ObjectId[];
        create: Types.ObjectId[];
    };
    auditConfig?: Record<string, unknown>;
}

// Main Schema

const scopeSchema = new Schema<IScope>(
    {
        name: { type: String, required: true },
        description: { type: String },
        type: { type: String, required: true },
        organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
        parentId: { type: Schema.Types.ObjectId, ref: 'Scope' },
        permissions: {
            view: { type: [Schema.Types.ObjectId], required: true },
            edit: { type: [Schema.Types.ObjectId], required: true },
            delete: { type: [Schema.Types.ObjectId], required: true },
            create: { type: [Schema.Types.ObjectId], required: true },
        },
        auditConfig: { type: Schema.Types.Mixed },
    },
    {
        timestamps: true, // createdAt and updatedAt
    },
);

// scope names must be unique within an organization
scopeSchema.index({ organizationId: 1, name: 1 }, { unique: true });

const Scope = mongoose.model<IScope>('Scope', scopeSchema);
export default Scope;
