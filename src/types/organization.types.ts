import { Types } from 'mongoose';

// Para distinguir entre scopeFields y agreementFields
export type FieldArrayName = 'scopeFields' | 'agreementFields';

export type OrganizationSearchFilters = {
    nameOrDisplayName?: string;
    name?: string;
    displayName?: string;
};

export interface IField {
    name: string;
    description: string;
    type: string;
    value?: unknown;
}

export interface IRole {
    _id?: Types.ObjectId;
    name: string;
    description: string;
}
