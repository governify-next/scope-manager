import { Router } from 'express';
import * as organizationController from '../controllers/organization.controller.js';
import {
    validateOrganization,
    validateRole,
    validateField,
    existingOrganization,
    existingRole,
    existingField,
    validateExistingRoleNamesBody,
    uniqueRole,
    maxRoles,
    uniqueField,
    hasOrgRole,
    notAdminRole,
    validateSearchOrganizations,
    creatorMustKeepAdminRole,
} from '../middlewares/organization.validator.js';
import { hasSystemRole, checkUserAuthentication } from '../middlewares/authenticator.validator.js';
import {
    existingMembership,
    maxMembers,
    notSelfRemoval,
    validateExpand,
    hasOrgMembership,
} from '../middlewares/membership.validator.js';
import { SystemRole } from '../types/systemRole.js';
import { anyOf } from '../middlewares/anyof.validator.js';

export const organizationRoutes = Router();

// Organización
organizationRoutes.post(
    '/organizations',
    checkUserAuthentication,
    hasSystemRole(SystemRole.ADMIN),
    validateOrganization,
    organizationController.createOrganization,
);
organizationRoutes.get(
    '/organizations',
    checkUserAuthentication,
    hasSystemRole(SystemRole.ADMIN),
    organizationController.getOrganizations,
);
organizationRoutes.post(
    '/organizations/search',
    checkUserAuthentication,
    validateSearchOrganizations,
    organizationController.searchOrganizations,
);
organizationRoutes.get(
    '/organizations/:orgName',
    checkUserAuthentication,
    existingOrganization,
    anyOf(hasOrgMembership, hasSystemRole(SystemRole.ADMIN)),
    organizationController.getOrganizationByName,
);
organizationRoutes.put(
    '/organizations/:orgName',
    checkUserAuthentication,
    existingOrganization,
    anyOf(hasOrgRole('admin'), hasSystemRole(SystemRole.ADMIN)),
    validateOrganization,
    organizationController.updateOrganization,
);
organizationRoutes.delete(
    '/organizations/:orgName',
    checkUserAuthentication,
    existingOrganization,
    anyOf(hasOrgRole('admin'), hasSystemRole(SystemRole.ADMIN)),
    organizationController.deleteOrganization,
);

// Roles
organizationRoutes.post(
    '/organizations/:orgName/roles',
    checkUserAuthentication,
    existingOrganization,
    anyOf(hasOrgRole('admin'), hasSystemRole(SystemRole.ADMIN)),
    validateRole,
    uniqueRole,
    maxRoles,
    organizationController.addRole,
);
organizationRoutes.put(
    '/organizations/:orgName/roles/:roleName',
    checkUserAuthentication,
    existingOrganization,
    anyOf(hasOrgRole('admin'), hasSystemRole(SystemRole.ADMIN)),
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
    anyOf(hasOrgRole('admin'), hasSystemRole(SystemRole.ADMIN)),
    notAdminRole,
    existingRole('params'),
    organizationController.deleteRole,
);

// ElementFields
organizationRoutes.post(
    '/organizations/:orgName/elementFields',
    checkUserAuthentication,
    existingOrganization,
    anyOf(hasOrgRole('admin'), hasSystemRole(SystemRole.ADMIN)),
    validateField,
    uniqueField('elementFields'),
    organizationController.addElementField,
);
organizationRoutes.put(
    '/organizations/:orgName/elementFields/:fieldName',
    checkUserAuthentication,
    existingOrganization,
    anyOf(hasOrgRole('admin'), hasSystemRole(SystemRole.ADMIN)),
    existingField('elementFields'),
    validateField,
    uniqueField('elementFields'),
    organizationController.updateElementField,
);
organizationRoutes.delete(
    '/organizations/:orgName/elementFields/:fieldName',
    checkUserAuthentication,
    existingOrganization,
    anyOf(hasOrgRole('admin'), hasSystemRole(SystemRole.ADMIN)),
    existingField('elementFields'),
    organizationController.deleteElementField,
);

// AgreementFields
organizationRoutes.post(
    '/organizations/:orgName/agreementFields',
    checkUserAuthentication,
    existingOrganization,
    anyOf(hasOrgRole('admin'), hasSystemRole(SystemRole.ADMIN)),
    validateField,
    uniqueField('agreementFields'),
    organizationController.addAgreementField,
);
organizationRoutes.put(
    '/organizations/:orgName/agreementFields/:fieldName',
    checkUserAuthentication,
    existingOrganization,
    anyOf(hasOrgRole('admin'), hasSystemRole(SystemRole.ADMIN)),
    existingField('agreementFields'),
    validateField,
    uniqueField('agreementFields'),
    organizationController.updateAgreementField,
);
organizationRoutes.delete(
    '/organizations/:orgName/agreementFields/:fieldName',
    checkUserAuthentication,
    existingOrganization,
    anyOf(hasOrgRole('admin'), hasSystemRole(SystemRole.ADMIN)),
    existingField('agreementFields'),
    organizationController.deleteAgreementField,
);

// Organization Members
organizationRoutes.get(
    '/organizations/:orgName/members',
    checkUserAuthentication,
    existingOrganization,
    anyOf(hasOrgRole('admin'), hasSystemRole(SystemRole.ADMIN)),
    validateExpand,
    organizationController.getMembers,
);
organizationRoutes.post(
    '/organizations/:orgName/members',
    checkUserAuthentication,
    existingOrganization,
    anyOf(hasOrgRole('admin'), hasSystemRole(SystemRole.ADMIN)),
    existingMembership(false, 'body'),
    maxMembers,
    organizationController.addUserToOrganization,
);

organizationRoutes.delete(
    '/organizations/:orgName/members/:username',
    checkUserAuthentication,
    existingOrganization,
    anyOf(hasOrgRole('admin'), hasSystemRole(SystemRole.ADMIN)),
    existingMembership(true, 'params'),
    notSelfRemoval,
    organizationController.removeUserFromOrganization,
);

organizationRoutes.get(
    '/organizations/:orgName/members/me/admin',
    checkUserAuthentication,
    existingOrganization,
    anyOf(hasOrgMembership, hasSystemRole(SystemRole.ADMIN)),
    organizationController.isCurrentUserOrganizationAdmin,
);

organizationRoutes.post(
    '/organizations/:orgName/members/:username/roles',
    checkUserAuthentication,
    existingOrganization,
    anyOf(hasOrgRole('admin'), hasSystemRole(SystemRole.ADMIN)),
    existingMembership(true, 'params'),
    validateExistingRoleNamesBody,
    creatorMustKeepAdminRole,
    organizationController.replaceUserRoles,
);
