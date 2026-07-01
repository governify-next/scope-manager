import * as organizationRepository from '../repositories/organization.repository.js';
import { IOrganization } from '../models/organization.model.js';
import type { FieldArrayName, OrganizationSearchFilters } from '../types/organization.types.js';
import type { ExpandMode } from '../types/membership.types.js';
import * as membershipService from '../services/membership.service.js';
import * as elementService from '../services/element.service.js';
import { Types } from 'mongoose';
import * as authenticatorIntegration from '../integrations/authenticator.integration.js';
import { createPagination } from '../utils/pagination.js';
import { SystemRole } from '../types/systemRole.js';
import { ForbiddenError } from '../utils/customErrors.js';

// Para trabajo interno en la organización
export const getOrganizationByName = async (orgName: string) => {
    return await organizationRepository.getOrganizationByName(orgName);
};

const addMembersCount = async (organizations: IOrganization[]) => {
    const memberCounts = await membershipService.countMembershipsByOrganizations(
        organizations.map((organization) => organization._id as Types.ObjectId),
    );

    return organizations.map((organization) => ({
        ...organization.toObject(),
        members: memberCounts.get(organization._id.toString()) ?? 0,
    }));
};

export const getOrganizationByNameWithMembers = async (orgName: string) => {
    const organization = await getOrganizationByName(orgName);
    if (!organization) return organization;

    const [organizationWithMembers] = await addMembersCount([organization]);
    return organizationWithMembers;
};

export const createOrganization = async (data: Partial<IOrganization>, userId: Types.ObjectId) => {
    const { name, displayName, description } = data;
    // Creamos la organización con el rol base
    const createdOrganization = await organizationRepository.createOrganization({
        name,
        displayName,
        description,
        createdBy: userId,
        roles: [{ name: 'admin', description: 'Organization Administrator' }],
    });
    // Obtenemos el id del rol admin generado por mongoose
    const adminRole = createdOrganization.roles.find((r) => r.name === 'admin')!;
    // Asignamos el rol admin al creador de la organización
    await membershipService.assignRole(userId, createdOrganization._id, adminRole._id!);
    // Devolvemos la organización creada
    return createdOrganization;
};

export const getOrganizations = async (page: number, limit: number) => {
    const { organizations, totalItems } = await organizationRepository.getOrganizations(
        page,
        limit,
    );
    return {
        organizations: await addMembersCount(organizations),
        pagination: createPagination(page, limit, totalItems),
    };
};

export const searchOrganizations = async (
    page: number,
    limit: number,
    filters: OrganizationSearchFilters,
    systemRole: string,
    userId: string,
) => {
    const organizationIds =
        systemRole === SystemRole.ADMIN
            ? undefined
            : (await membershipService.findMembershipsByUser(new Types.ObjectId(userId))).map(
                  (membership) => membership.organizationId,
              );

    const { organizations, totalItems } = await organizationRepository.searchOrganizations(
        page,
        limit,
        filters,
        organizationIds,
    );

    return {
        organizations: await addMembersCount(organizations),
        pagination: createPagination(page, limit, totalItems),
    };
};

export const getOrganizationById = async (organizationId: Types.ObjectId) => {
    return await organizationRepository.getOrganizationById(organizationId);
};

export const updateOrganization = async (orgName: string, data: Partial<IOrganization>) => {
    const { name, displayName, description } = data;
    return await organizationRepository.updateOrganization(orgName, {
        name,
        displayName,
        description,
    });
};

export const deleteOrganization = async (orgName: string) => {
    const organization = await getOrganizationByName(orgName);
    const orgId = organization!._id;
    // Borramos las memberships asociadas
    await membershipService.removeMembershipsByOrganization(orgId);

    // TODO: borrado en cascada de agreement templates

    // Borramos los elements asociados
    const elements = await elementService.getElementsByOrganization(orgId);
    await Promise.all(elements.map((e) => elementService.deleteElement(orgId, e.name)));
    // Borramos la organización
    return await organizationRepository.deleteOrganization(orgName);
};

export const addRole = async (orgName: string, role: { name: string; description: string }) => {
    return await organizationRepository.addRole(orgName, role);
};

export const updateRole = async (
    orgName: string,
    roleName: string,
    data: { name: string; description: string },
) => {
    return await organizationRepository.updateRole(orgName, roleName, data);
};

export const deleteRole = async (orgName: string, roleName: string) => {
    const org = await getOrganizationByName(orgName);
    // Como obtenemos la org, pasamos ya el id del rol para el borrado en Membership
    const roleToDelete = org!.roles.find((r) => r.name === roleName);
    // Llamamos a Membership para que borre el rol de las asignaciones
    await membershipService.removeRoleFromMemberships(roleToDelete!._id!); // ! garantiza a Ts no nulo ahora que tenemos id? en interfaz
    // Borramos el rol de la organización
    return await organizationRepository.deleteRole(orgName, roleName);
};

export const addField = async (
    arrayName: FieldArrayName,
    orgName: string,
    field: { name: string; description: string; type: string; value?: unknown },
) => {
    return await organizationRepository.addField(orgName, arrayName, field);
};

export const updateField = async (
    arrayName: FieldArrayName,
    orgName: string,
    fieldName: string,
    data: { name: string; description: string; type: string; value?: unknown },
) => {
    return await organizationRepository.updateField(orgName, arrayName, fieldName, data);
};

export const deleteField = async (
    arrayName: FieldArrayName,
    orgName: string,
    fieldName: string,
) => {
    return await organizationRepository.deleteField(orgName, arrayName, fieldName);
};

export const addUserToOrganization = async (orgName: string, username: string) => {
    // Obtenemos id de usuario
    const user = await authenticatorIntegration.getUserByUsername(username);
    const userId = user!._id;
    // Obtenemos id de la organización
    const organization = await getOrganizationByName(orgName);
    const organizationId = organization!._id;
    // Creamos la membership
    return await membershipService.createMembership(organizationId, userId);
};

export const removeUserFromOrganization = async (orgName: string, username: string) => {
    const organization = await getOrganizationByName(orgName);
    const user = await authenticatorIntegration.getUserByUsername(username);
    const organizationId = organization!._id;
    const userId = user!._id;

    if (organization!.createdBy.toString() === userId.toString()) {
        throw new ForbiddenError(
            'The organization creator cannot be removed from the organization',
        );
    }

    return await membershipService.removeMembership(organizationId, userId);
};

export const isOrganizationAdmin = async (orgName: string, userId: string, systemRole: string) => {
    if (systemRole === SystemRole.ADMIN) return true;

    const organization = await getOrganizationByName(orgName);
    const adminRole = organization!.roles.find((role) => role.name === 'admin');

    if (!adminRole) return false;

    const membership = await membershipService.findEspecificRole(
        organization!._id,
        new Types.ObjectId(userId),
        adminRole._id!,
    );

    return Boolean(membership);
};

export const replaceUserRoles = async (orgName: string, username: string, roleNames: string[]) => {
    const user = await authenticatorIntegration.getUserByUsername(username);
    const organization = await getOrganizationByName(orgName);
    const rolesId = roleNames.map(
        (roleName) => organization!.roles.find((role) => role.name === roleName)!._id!,
    );

    return await membershipService.replaceRoles(organization!._id, user!._id, rolesId);
};

export const getMembers = async (orgName: string, expand: ExpandMode) => {
    const organization = await getOrganizationByName(orgName);
    const memberships = await membershipService.getMembershipsByOrganization(
        organization!._id,
        expand,
    );

    // Sin expansión, devolvemos las memberships tal cual están guardadas
    if (expand === 'none') return memberships;

    // Con expansión, reemplazamos ids por datos resueltos desde organization y authenticator
    return await Promise.all(
        memberships.map(async (m) => {
            const user = await authenticatorIntegration.getUserById(m.userId.toString());

            return {
                ...m.toObject(), // convertimos el documento de mongoose a un objeto plano (solo datos) y copiamos sus propiedades en un objeto nuevo
                userId: expand === 'full' ? user : { _id: user._id, username: user.username },
                rolesId: undefined, // sobreescribimos los id de roles a undefined (los eliminamos)
                roles: m.rolesId.map((id) => {
                    const role = organization!.roles.find(
                        (r) => r._id!.toString() === id.toString(),
                    );
                    return expand === 'full' ? role : { _id: role?._id, name: role?.name };
                }),
            };
        }),
    );
};
