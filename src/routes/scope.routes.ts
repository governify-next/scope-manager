import { Router } from 'express';
import * as scopeController from '../controllers/scope.controller.js';
import {
    existingScope,
    validateScope,
    validateScopeAuditConfig,
    validateScopeGrammar,
    validateScopePermissionRoles,
    validateScopesTreeGrammar,
} from '../middlewares/scope.validator.js';
import { existingOrganization } from '../middlewares/organization.validator.js';

export const scopeRoutes = Router();

scopeRoutes.post(
    '/organizations/:orgName/scopes',
    existingOrganization,
    validateScope,
    validateScopeGrammar,
    scopeController.createScope,
);
scopeRoutes.post(
    '/organizations/:orgName/scopes/tree',
    existingOrganization,
    validateScopesTreeGrammar,
    scopeController.createScopes,
);
scopeRoutes.get(
    '/organizations/:orgName/scopes',
    existingOrganization,
    scopeController.getScopesByOrganization,
);
scopeRoutes.get(
    '/organizations/:orgName/scopes/:scopeName',
    existingOrganization,
    scopeController.getScopeByName,
);
scopeRoutes.put(
    '/organizations/:orgName/scopes/:scopeName',
    existingOrganization,
    existingScope(),
    validateScope,
    validateScopeAuditConfig,
    scopeController.updateScope,
);
scopeRoutes.delete(
    '/organizations/:orgName/scopes/:scopeName',
    existingOrganization,
    existingScope(),
    scopeController.deleteScopesByParent,
);

scopeRoutes.post(
    '/organizations/:orgName/scopes/:scopeName/permissions/:permissionName',
    existingOrganization,
    validateScopePermissionRoles,
    scopeController.addRoleToScopePermission,
);
