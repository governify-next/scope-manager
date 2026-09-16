import { bootEnv } from '../config/bootConfig.js';
import { getServiceHeaders } from '../utils/serviceAuthentication.js';
import { NotFoundError } from '../utils/customErrors.js';
import { IUser } from '../types/user.types.js';
import { SystemRole } from '../types/systemRole.js';

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

export const createUser = async (data: Partial<IUser>, createdBy: string) => {
    const { username, name, surname, email, password } = data;
    const response = await fetch(`${AUTHENTICATOR_SERVICE_URL}/api/v1/users`, {
        method: 'POST',
        headers: getServiceHeaders(),
        body: JSON.stringify({
            username,
            name,
            surname,
            email,
            password,
            systemRole: SystemRole.USER,
            status: 'ACTIVE',
            createdBy,
        }),
    });

    const result = await response.json();

    if (!result.success) {
        throw new Error(`Failed to create user in authenticator (status: ${response.status})`);
    }

    return result.data._id;
};
