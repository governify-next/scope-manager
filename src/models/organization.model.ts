import mongoose, { Schema, Document, Types } from 'mongoose';
import type { IField, IRole } from '../types/organization.types.js';

// Subdocuments

const fieldSchema = new Schema(
    {
        name: { type: String, required: true },
        description: { type: String, required: true },
        type: { type: String, required: true, enum: ['string', 'enum', 'number'] },
        value: {
            type: Schema.Types.Mixed, // accepts any value
            required: function () {
                return this.type === 'enum';
            },
            validate: {
                // 2nd safety gate for value
                validator: function (value: unknown) {
                    if (this.type === 'enum') {
                        if (value === undefined || !Array.isArray(value)) {
                            return false;
                        }
                    } else {
                        if (value !== undefined) {
                            return false;
                        }
                    }
                    return true;
                },
                message: 'The value field must exist and be a list only if the type is an enum',
            },
        },
    },
    { _id: false },
);

const roleSchema = new Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
});

// TypeScript Interface

export interface IOrganization extends Document {
    name: string;
    displayName: string;
    description: string;
    createdBy: Types.ObjectId;
    scopeFields: IField[];
    agreementFields: IField[];
    roles: IRole[];
}

// Main Schema

const organizationSchema = new Schema<IOrganization>(
    {
        name: { type: String, required: true, unique: true },
        displayName: { type: String, default: '' },
        description: { type: String, required: true },
        createdBy: { type: Schema.Types.ObjectId, required: true },
        scopeFields: { type: [fieldSchema], default: [] },
        agreementFields: { type: [fieldSchema], default: [] },
        roles: {
            type: [roleSchema],
            default: [],
        },
    },
    {
        timestamps: true, // createdAt and updatedAt
    },
);

const Organization = mongoose.model<IOrganization>('Organization', organizationSchema);
export default Organization;
