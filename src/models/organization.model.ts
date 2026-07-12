import mongoose, { Schema, Document, Types } from 'mongoose';
import type { IField, IRole, IScopeConfig } from '../types/organization.types.js';

// Subdocumentos

const fieldSchema = new Schema(
    {
        name: { type: String, required: true },
        description: { type: String, required: true },
        type: { type: String, required: true, enum: ['string', 'enum', 'number'] },
        value: {
            type: Schema.Types.Mixed, // acepta cualquier valor
            required: function () {
                return this.type === 'enum';
            },
            validate: {
                // 2a puerta de seguridad para value
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

const scopeTypeSchema = new Schema(
    {
        name: { type: String, required: true },
        description: { type: String },
        childTypes: { type: [String], default: [] },
        auditFields: { type: [fieldSchema], default: [] },
    },
    { _id: false },
);

const scopeConfigSchema = new Schema(
    {
        rootTypes: { type: [String], default: [] },
        scopeTypes: { type: [scopeTypeSchema], default: [] },
    },
    { _id: false },
);

const roleSchema = new Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
});

// Interfaz para TypeScript

export interface IOrganization extends Document {
    name: string;
    displayName: string;
    description: string;
    createdBy: Types.ObjectId;
    scopeConfig: IScopeConfig;
    agreementFields: IField[];
    roles: IRole[];
}

// Esquema principal

const organizationSchema = new Schema<IOrganization>(
    {
        name: { type: String, required: true, unique: true },
        displayName: { type: String, default: '' },
        description: { type: String, required: true },
        createdBy: { type: Schema.Types.ObjectId, required: true },
        scopeConfig: { type: scopeConfigSchema, default: () => ({}) },
        agreementFields: { type: [fieldSchema], default: [] },
        roles: {
            type: [roleSchema],
            default: [],
        },
    },
    {
        timestamps: true, // createdAt y updatedAt
    },
);

const Organization = mongoose.model<IOrganization>('Organization', organizationSchema);
export default Organization;
