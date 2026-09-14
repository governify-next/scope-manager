import dotenv from 'dotenv';
import path from 'path';

// Load .env file
const envPath = process.env.GOV_BOOT_ENV_PATH || path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath, quiet: true });

export const bootEnv = {
    // Service configuration
    NODE_ENV: process.env.NODE_ENV || 'development',
    GOV_LOG_LEVEL: process.env.GOV_LOG_LEVEL || 'INFO',
    GOV_SERVICE_NAME: process.env.GOV_SERVICE_NAME || 'scope-manager',
    PORT: process.env.PORT || '5901',

    // Internal service URLs
    AUTHENTICATOR_SERVICE_URL: process.env.AUTHENTICATOR_SERVICE_URL || 'http://localhost:5900',

    // Database URIs
    MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/governify-next',

    // JWT configuration
    CLIENT_ID: process.env.CLIENT_ID || 'scope-manager',
    CLIENT_SECRET: process.env.CLIENT_SECRET || 'scope_manager_client_secret',
    JWT_SECRET: process.env.JWT_SECRET || 'governify_next_secret_key',
    JWT_ISSUER: process.env.JWT_ISSUER || 'authenticator',
    JWT_AUDIENCE: process.env.JWT_AUDIENCE || 'governify-next',

    // Application-specific settings
    MAX_ROLES_PER_ORGANIZATION: Number(process.env.MAX_ROLES_PER_ORGANIZATION || '100'),
    MAX_MEMBERS_PER_ORGANIZATION: Number(process.env.MAX_MEMBERS_PER_ORGANIZATION || '1000'),
};
