import { type Request, type Response, type NextFunction } from 'express';
import { NotFoundError } from '../utils/customErrors.js';
import { getProviderById } from '../services/providers/provider.service.js';

export const existingProvider = (req: Request, res: Response, next: NextFunction) => {
    const { providerId } = req.params;
    if (!getProviderById(providerId)) {
        return next(new NotFoundError(`Provider with id '${providerId}' not found`));
    }

    next();
};
