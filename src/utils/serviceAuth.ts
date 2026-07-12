import jwt from 'jsonwebtoken';
import { bootEnv } from '../config/bootConfig.js';

const AUTHENTICATOR_SERVICE_URL = bootEnv.AUTHENTICATOR_SERVICE_URL;
const CLIENT_ID = bootEnv.CLIENT_ID;
const CLIENT_SECRET = bootEnv.CLIENT_SECRET;

// Renew before the actual expiration so a token cannot expire mid-request
const RENEWAL_MARGIN_MS = 30_000;

let cachedToken: { value: string; expiresAt: number } | null = null;

const fetchServiceToken = async () => {
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

    const token: string = result.data.token;
    const { exp } = jwt.decode(token) as { exp: number };

    return { value: token, expiresAt: exp * 1000 };
};

export const getServiceHeaders = async () => {
    if (!cachedToken || Date.now() >= cachedToken.expiresAt - RENEWAL_MARGIN_MS)
        cachedToken = await fetchServiceToken();

    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cachedToken.value}`,
    };
};
