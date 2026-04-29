import jwt from 'jsonwebtoken';
import { ForbiddenError, UnauthorizedError } from '../utils/customErrors.js';
import { type Request, type Response, type NextFunction } from 'express';
import { Types } from 'mongoose';
import { getLogger } from '../utils/logger.js';
import { SystemRole } from '../types/systemRole.js';
import { bootEnv } from '../config/bootConfig.js';

const logger = getLogger().setTag('authentication.ts');

const JWT_SECRET = bootEnv.JWT_SECRET;
const USER_AUTHENTICATION_ENABLED = bootEnv.USER_AUTHENTICATION_ENABLED;

declare module 'express' {
    interface Request {
        auth?: UserJwtPayload;
    }
}

export interface UserJwtPayload {
    userId: Types.ObjectId;
    username: string;
    systemRole: SystemRole;
}

export const checkUserAuthentication = (req: Request, res: Response, next: NextFunction) => {
    if (!USER_AUTHENTICATION_ENABLED) {
        logger.debug(
            'Skipping user authentication in development environment!! DO NOT USE IN PRODUCTION!!',
        );
        return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(new UnauthorizedError('Authorization header missing or malformed'));
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as UserJwtPayload;

        req.auth = decoded; // Attach UserJwtPayload to the Request for downstream use
        next();
    } catch (err) {
        logger.debug('JWT verification failed', err);
        next(new UnauthorizedError('Invalid or expired token'));
    }
};

export const hasRole = (requiredRole: SystemRole) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!USER_AUTHENTICATION_ENABLED) {
            logger.debug(
                'Skipping role check in development environment!! DO NOT USE IN PRODUCTION!!',
            );
            return next();
        }

        if (!req.auth) {
            return next(new UnauthorizedError('User not authenticated'));
        }

        const userRole = req.auth.systemRole;
        if (userRole !== requiredRole) {
            return next(new ForbiddenError('Insufficient permissions'));
        }

        next();
    };
};
