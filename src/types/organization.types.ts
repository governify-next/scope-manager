import { Types } from 'mongoose';

// To tell scopeFields and agreementFields apart
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
