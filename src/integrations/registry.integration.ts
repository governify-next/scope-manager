import { bootEnv } from '../config/bootConfig.js';
import { getServiceHeaders } from '../utils/serviceAuthentication.js';

const REGISTRY_SERVICE_URL = bootEnv.REGISTRY_SERVICE_URL;

export const countAgreementCollectionsByScopes = async (scopeIds: string[]) => {
    const response = await fetch(`${REGISTRY_SERVICE_URL}/api/v1/agreementCollections/count`, {
        method: 'POST',
        headers: getServiceHeaders(),
        body: JSON.stringify({ scopeIds }),
    });

    const result = await response.json();

    if (!result.success) {
        throw new Error(
            `Failed to count agreement collections from registry (status: ${response.status})`,
        );
    }

    return result.data as { scopeId: string; collections: number }[];
};

export const removeRoleFromAgreementCollectionPermissions = async (roleId: string) => {
    const response = await fetch(
        `${REGISTRY_SERVICE_URL}/api/v1/agreementCollections/permissions/roles/${roleId}`,
        {
            method: 'DELETE',
            headers: getServiceHeaders(),
        },
    );

    const result = await response.json();

    if (!result.success) {
        throw new Error(
            `Failed to remove role '${roleId}' from agreement collection permissions in registry (status: ${response.status})`,
        );
    }
};
