import { bootEnv } from '../config/bootConfig.js';
import { getServiceHeaders } from '../utils/serviceAuthentication.js';
import { NotFoundError } from '../utils/customErrors.js';

const AUTHENTICATOR_SERVICE_URL = bootEnv.AUTHENTICATOR_SERVICE_URL;

export const getUserByUsername = async (username: string) => {
    const response = await fetch(`${AUTHENTICATOR_SERVICE_URL}/api/v1/users/username/${username}`, {
        method: 'GET',
        headers: getServiceHeaders(),
    });

    const result = await response.json();

    if (!result.success) {
        if (response.status === 404 || result.appCode === 'NOT_FOUND') {
            throw new NotFoundError(`User '${username}' not found`);
        }

        throw new Error(
            `Failed to fetch user '${username}' from authenticator (status: ${response.status})`,
        );
    }

    return result.data;
};

export const getUserById = async (userId: string) => {
    const response = await fetch(`${AUTHENTICATOR_SERVICE_URL}/api/v1/users/${userId}`, {
        method: 'GET',
        headers: getServiceHeaders(),
    });

    const result = await response.json();

    if (!result.success) {
        if (response.status === 404 || result.appCode === 'NOT_FOUND') {
            throw new NotFoundError(`User '${userId}' not found`);
        }

        throw new Error(
            `Failed to fetch user '${userId}' from authenticator (status: ${response.status})`,
        );
    }

    return result.data;
};
