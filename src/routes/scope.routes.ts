import { Router } from 'express';
import * as scopeController from '../controllers/scope.controller.js';
import {
    existingScope,
    validateScope,
    validateScopePermissionRoles,
} from '../middlewares/scope.validator.js';
import { existingOrganization } from '../middlewares/organization.validator.js';
import { checkUserAuthentication } from '../middlewares/authenticator.validator.js';

export const scopeRoutes = Router();

scopeRoutes.post(
    '/organizations/:orgName/scopes',
    checkUserAuthentication,
    existingOrganization,
    validateScope,
    scopeController.createScope,
);
scopeRoutes.post(
    '/organizations/:orgName/scopes/tree',
    checkUserAuthentication,
    existingOrganization,
    scopeController.createScopes,
);
scopeRoutes.get(
    '/organizations/:orgName/scopes',
    checkUserAuthentication,
    existingOrganization,
    scopeController.getScopesByOrganization,
);
scopeRoutes.get(
    '/organizations/:orgName/scopes/:scopeId',
    checkUserAuthentication,
    existingOrganization,
    scopeController.getScopeById,
);
scopeRoutes.put(
    '/organizations/:orgName/scopes/:scopeId',
    checkUserAuthentication,
    existingOrganization,
    existingScope(),
    validateScope,
    scopeController.updateScope,
);
scopeRoutes.delete(
    '/organizations/:orgName/scopes/:scopeId',
    checkUserAuthentication,
    existingOrganization,
    existingScope(),
    scopeController.deleteScopesByParent,
);

scopeRoutes.post(
    '/organizations/:orgName/scopes/:scopeId/permissions/:permissionName',
    checkUserAuthentication,
    existingOrganization,
    validateScopePermissionRoles,
    scopeController.addRoleToScopePermission,
);
