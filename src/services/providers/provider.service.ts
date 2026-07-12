import * as organizationService from '../organization.service.js';
import { IProvider } from '../../types/provider.types.js';
import { PV_GITHUB } from './implementations/github.provider.js';

// Centralized providers catalog.
export const providers: Record<string, IProvider> = { PV_GITHUB };

export const getProviders = () => Object.values(providers);

export const getProviderById = (providerId: string) => providers[providerId];

export const setOrganizationProvider = async (orgName: string, providerId: string) => {
    const provider = getProviderById(providerId);
    return await organizationService.setScopeConfig(orgName, provider.scopeConfig);
};
