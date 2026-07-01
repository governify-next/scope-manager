import { bootEnv } from '../config/bootConfig.js';

const AUTHENTICATOR_SERVICE_URL = bootEnv.AUTHENTICATOR_SERVICE_URL;
const CLIENT_ID = bootEnv.CLIENT_ID;
const CLIENT_SECRET = bootEnv.CLIENT_SECRET;

export const serviceHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: '', // This will be set after fetching the service token
};

const getServiceToken = async () => {
    const response = await fetch(`${AUTHENTICATOR_SERVICE_URL}/api/v1/services/token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            clientId: CLIENT_ID,
            clientSecret: CLIENT_SECRET,
        }),
    });

    const result = await response.json();

    if (!result.success)
        throw new Error(
            `Failed to fetch service token from authenticator (status: ${response.status})`,
        );

    return result.data.token;
};

export const initializeServiceHeaders = async () => {
    const token = await getServiceToken();
    serviceHeaders.Authorization = `Bearer ${token}`;
};
