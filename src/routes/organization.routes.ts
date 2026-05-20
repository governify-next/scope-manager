import { Router } from 'express';
import * as organizationController from '../controllers/organization.controller.js';
import {
    validateOrganization,
    validateRole,
    validateField,
    existingOrganization,
    existingRole,
    existingField,
    uniqueRole,
    maxRoles,
    uniqueField,
    hasOrgRole,
    notAdminRole,
} from '../middlewares/organization.validator.js';
import { hasRole, checkUserAuthentication } from '../middlewares/user.authenticator.js';
import { validateUsername } from '../middlewares/user.validator.js';
import {
    existingMembership,
    maxMembers,
    notSelfRemoval,
    validateExpand,
} from '../middlewares/membership.validator.js';
import { SystemRole } from '../types/systemRole.js';

export const organizationRoutes = Router();

// Organización
organizationRoutes.post(
    '/organizations',
    checkUserAuthentication,
    hasRole(SystemRole.ADMIN),
    validateOrganization,
    organizationController.createOrganization,
);
organizationRoutes.get('/organizations', organizationController.getOrganizations);
organizationRoutes.get(
    '/organizations/:orgName',
    existingOrganization,
    organizationController.getOrganizationByName,
);
organizationRoutes.put(
    '/organizations/:orgName',
    checkUserAuthentication,
    existingOrganization,
    hasOrgRole('admin'),
    validateOrganization,
    organizationController.updateOrganization,
);
organizationRoutes.delete(
    '/organizations/:orgName',
    checkUserAuthentication,
    existingOrganization,
    hasOrgRole('admin'),
    organizationController.deleteOrganization,
);

// Roles
organizationRoutes.post(
    '/organizations/:orgName/roles',
    checkUserAuthentication,
    existingOrganization,
    hasOrgRole('admin'),
    validateRole,
    uniqueRole,
    maxRoles,
    organizationController.addRole,
);
organizationRoutes.put(
    '/organizations/:orgName/roles/:roleName',
    checkUserAuthentication,
    existingOrganization,
    hasOrgRole('admin'),
    notAdminRole,
    existingRole('params'),
    validateRole,
    uniqueRole,
    organizationController.updateRole,
);
organizationRoutes.delete(
    '/organizations/:orgName/roles/:roleName',
    checkUserAuthentication,
    existingOrganization,
    hasOrgRole('admin'),
    notAdminRole,
    existingRole('params'),
    organizationController.deleteRole,
);

// ElementFields
organizationRoutes.post(
    '/organizations/:orgName/elementFields',
    checkUserAuthentication,
    existingOrganization,
    hasOrgRole('admin'),
    validateField,
    uniqueField('elementFields'),
    organizationController.addElementField,
);
organizationRoutes.put(
    '/organizations/:orgName/elementFields/:fieldName',
    checkUserAuthentication,
    existingOrganization,
    hasOrgRole('admin'),
    existingField('elementFields'),
    validateField,
    uniqueField('elementFields'),
    organizationController.updateElementField,
);
organizationRoutes.delete(
    '/organizations/:orgName/elementFields/:fieldName',
    checkUserAuthentication,
    existingOrganization,
    hasOrgRole('admin'),
    existingField('elementFields'),
    organizationController.deleteElementField,
);

// AgreementFields
organizationRoutes.post(
    '/organizations/:orgName/agreementFields',
    checkUserAuthentication,
    existingOrganization,
    hasOrgRole('admin'),
    validateField,
    uniqueField('agreementFields'),
    organizationController.addAgreementField,
);
organizationRoutes.put(
    '/organizations/:orgName/agreementFields/:fieldName',
    checkUserAuthentication,
    existingOrganization,
    hasOrgRole('admin'),
    existingField('agreementFields'),
    validateField,
    uniqueField('agreementFields'),
    organizationController.updateAgreementField,
);
organizationRoutes.delete(
    '/organizations/:orgName/agreementFields/:fieldName',
    checkUserAuthentication,
    existingOrganization,
    hasOrgRole('admin'),
    existingField('agreementFields'),
    organizationController.deleteAgreementField,
);

// Org - Users
organizationRoutes.get(
    '/organizations/:orgName/members',
    checkUserAuthentication,
    existingOrganization,
    hasOrgRole('admin'),
    validateExpand,
    organizationController.getMembers,
);
organizationRoutes.post(
    '/organizations/:orgName/members',
    checkUserAuthentication,
    existingOrganization,
    hasOrgRole('admin'),
    validateUsername,
    existingMembership(false, 'body'),
    maxMembers,
    organizationController.addUserToOrganization,
);

organizationRoutes.delete(
    '/organizations/:orgName/members/:username',
    checkUserAuthentication,
    existingOrganization,
    hasOrgRole('admin'),
    existingMembership(true, 'params'),
    notSelfRemoval,
    organizationController.removeUserFromOrganization,
);

// Org - User roles
organizationRoutes.post(
    '/organizations/:orgName/members/:username/roles',
    checkUserAuthentication,
    existingOrganization,
    hasOrgRole('admin'),
    existingMembership(true, 'params'),
    existingRole('body'),
    organizationController.addRoleToUser,
);

organizationRoutes.delete(
    '/organizations/:orgName/members/:username/roles/:roleName',
    checkUserAuthentication,
    existingOrganization,
    hasOrgRole('admin'),
    existingMembership(true, 'params'),
    existingRole('params'),
    organizationController.removeRoleFromUser,
);
