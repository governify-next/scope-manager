import { Types } from 'mongoose';

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

export interface IScopeType {
    name: string;
    description?: string;
    childTypes: string[];
    auditFields: IField[];
}

export interface IScopeConfig {
    rootTypes: string[];
    scopeTypes: IScopeType[];
}
