import { IProvider } from '../../../types/provider.types.js';

export const PV_GITHUB: IProvider = {
    id: 'PV_GITHUB',
    name: 'GitHub',
    scopeConfig: {
        rootTypes: ['Organizations'],
        scopeTypes: [
            {
                name: 'Organizations',
                description: 'GitHub organization or user that owns the repositories',
                childTypes: ['Repositories'],
                auditFields: [
                    {
                        name: 'owner',
                        description: 'GitHub organization or user login',
                        type: 'string',
                    },
                    {
                        name: 'token',
                        description: 'Access token to audit the repositories',
                        type: 'string',
                    },
                ],
            },
            {
                name: 'Repositories',
                description: 'GitHub repository',
                childTypes: ['Members'],
                auditFields: [
                    { name: 'repository', description: 'Repository name', type: 'string' },
                ],
            },
            {
                name: 'Members',
                description: 'Member of a repository',
                childTypes: [],
                auditFields: [{ name: 'username', description: 'GitHub username', type: 'string' }],
            },
        ],
    },
};
