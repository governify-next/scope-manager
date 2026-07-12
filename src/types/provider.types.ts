import type { IScopeConfig } from './organization.types.js';

export interface IProvider {
    id: string;
    name: string;
    scopeConfig: IScopeConfig;
}
