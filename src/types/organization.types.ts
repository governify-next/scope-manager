// Para distinguir entre elementFields y agreementFields
export type FieldArrayName = 'elementFields' | 'agreementFields';

export type OrganizationSearchFilters = {
    nameOrDisplayName?: string;
    name?: string;
    displayName?: string;
};
