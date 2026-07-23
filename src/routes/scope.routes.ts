import { Router } from 'express';
import * as scopeController from '../controllers/scope.controller.js';
import {
    existingScope,
    validScopeId,
    validateScope,
    validateScopePermissionRoles,
} from '../middlewares/scope.validator.js';
import { existingOrganization } from '../middlewares/organization.validator.js';

export const scopeRoutes = Router();

scopeRoutes.post(
    '/organizations/:orgName/scopes',
    existingOrganization,
    validateScope,
    scopeController.createScope,
);
scopeRoutes.post(
    '/organizations/:orgName/scopes/tree',
    existingOrganization,
    scopeController.createScopes,
);
scopeRoutes.get(
    '/organizations/:orgName/scopes',
    existingOrganization,
    scopeController.getScopesByOrganization,
);
scopeRoutes.get(
    '/organizations/:orgName/scopes/:scopeId',
    existingOrganization,
    validScopeId,
    scopeController.getScopeById,
);
scopeRoutes.put(
    '/organizations/:orgName/scopes/:scopeId',
    existingOrganization,
    validScopeId,
    existingScope(),
    validateScope,
    scopeController.updateScope,
);
scopeRoutes.delete(
    '/organizations/:orgName/scopes/:scopeId',
    existingOrganization,
    validScopeId,
    existingScope(),
    scopeController.deleteScopesByParent,
);

scopeRoutes.post(
    '/organizations/:orgName/scopes/:scopeId/permissions/:permissionName',
    existingOrganization,
    validScopeId,
    validateScopePermissionRoles,
    scopeController.addRoleToScopePermission,
);
