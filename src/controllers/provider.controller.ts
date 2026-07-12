import { Request, Response, NextFunction } from 'express';
import * as providerService from '../services/providers/provider.service.js';
import { sendSuccess } from '../utils/standardResponse.js';

export const getProviders = (_req: Request, res: Response) => {
    return sendSuccess(res, { data: providerService.getProviders() });
};

export const getProviderById = (req: Request, res: Response) => {
    const provider = providerService.getProviderById(req.params.providerId);
    return sendSuccess(res, { data: provider });
};

export const setOrganizationProvider = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const organization = await providerService.setOrganizationProvider(
            req.params.orgName,
            req.params.providerId,
        );
        return sendSuccess(res, { data: organization, message: 'Provider set' });
    } catch (err) {
        next(err);
    }
};
