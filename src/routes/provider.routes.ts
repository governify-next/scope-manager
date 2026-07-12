import { Router } from 'express';
import * as providerController from '../controllers/provider.controller.js';
import { existingProvider } from '../middlewares/provider.validator.js';
import { existingOrganization } from '../middlewares/organization.validator.js';

export const providerRoutes = Router();

providerRoutes.get('/providers', providerController.getProviders);
providerRoutes.get('/providers/:providerId', existingProvider, providerController.getProviderById);
providerRoutes.post(
    '/organizations/:orgName/providers/:providerId',
    existingOrganization,
    existingProvider,
    providerController.setOrganizationProvider,
);
