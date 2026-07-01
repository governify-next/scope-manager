import Organization, { IOrganization } from '../models/organization.model.js';
import { DuplicateKeyError } from '../utils/customErrors.js';
import type { FieldArrayName, OrganizationSearchFilters } from '../types/organization.types.js';
import { Types } from 'mongoose';

export const createOrganization = async (data: Partial<IOrganization>) => {
    try {
        const organization = new Organization(data);
        return await organization.save();
    } catch (err) {
        const e = err as {
            code?: number;
            keyPattern?: { name?: number };
            keyValue?: unknown;
            message?: string;
        };
        if (e.code === 11000 && e.keyPattern?.name) {
            throw new DuplicateKeyError(
                'An organization with that name already exists',
                e.keyValue || e.message,
            );
        }
        throw err;
    }
};

export const getOrganizations = async (page: number, limit: number) => {
    const skip = (page - 1) * limit;
    const [organizations, totalItems] = await Promise.all([
        Organization.find().skip(skip).limit(limit),
        Organization.countDocuments(),
    ]);
    return { organizations, totalItems };
};

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const searchOrganizations = async (
    page: number,
    limit: number,
    filters: OrganizationSearchFilters,
    organizationIds?: Types.ObjectId[],
) => {
    const skip = (page - 1) * limit;
    const query: Record<string, unknown> = {};
    if (organizationIds) {
        query._id = { $in: organizationIds };
    }
    if (filters.nameOrDisplayName) {
        const nameOrDisplayNameRegex = new RegExp(escapeRegex(filters.nameOrDisplayName), 'i');
        query.$or = [{ name: nameOrDisplayNameRegex }, { displayName: nameOrDisplayNameRegex }];
    }
    if (filters.name) {
        query.name = new RegExp(escapeRegex(filters.name), 'i');
    }
    if (filters.displayName) {
        query.displayName = new RegExp(escapeRegex(filters.displayName), 'i');
    }
    const [organizations, totalItems] = await Promise.all([
        Organization.find(query).skip(skip).limit(limit),
        Organization.countDocuments(query),
    ]);
    return { organizations, totalItems };
};

export const getOrganizationById = async (organizationId: Types.ObjectId) => {
    return await Organization.findById(organizationId);
};

// Para trabajo interno en la organización
export const getOrganizationByName = async (orgName: string) => {
    return await Organization.findOne({ name: orgName });
};

export const updateOrganization = async (orgName: string, data: Partial<IOrganization>) => {
    try {
        return await Organization.findOneAndUpdate({ name: orgName }, data, { new: true });
    } catch (err) {
        const e = err as {
            code?: number;
            keyPattern?: { name?: number };
            keyValue?: unknown;
            message?: string;
        };
        if (e.code === 11000 && e.keyPattern?.name) {
            throw new DuplicateKeyError(
                'An organization with that name already exists',
                e.keyValue || e.message,
            );
        }
        throw err;
    }
};

export const deleteOrganization = async (orgName: string) => {
    return await Organization.findOneAndDelete({ name: orgName });
};

export const addRole = async (orgName: string, role: { name: string; description: string }) => {
    return await Organization.findOneAndUpdate(
        { name: orgName },
        { $push: { roles: role } },
        { new: true },
    );
};

export const updateRole = async (
    orgName: string,
    oldRoleName: string,
    data: { name: string; description: string },
) => {
    return await Organization.findOneAndUpdate(
        { name: orgName, 'roles.name': oldRoleName },
        {
            $set: {
                'roles.$.name': data.name, // $ nos dice el elemento del array que ha hecho "match" a lo puesto arriba
                'roles.$.description': data.description,
            },
        },
        { new: true },
    );
};

export const deleteRole = async (orgName: string, roleName: string) => {
    return await Organization.findOneAndUpdate(
        { name: orgName },
        { $pull: { roles: { name: roleName } } },
        { new: true },
    );
};

// Fields genéricos para que elementFields y agreementFields compartan la misma lógica

type FieldData = { name: string; description: string; type: string; value?: unknown };

export const addField = async (orgName: string, arrayName: FieldArrayName, field: FieldData) => {
    return await Organization.findOneAndUpdate(
        { name: orgName },
        { $push: { [arrayName]: field } },
        { new: true },
    );
};

export const updateField = async (
    orgName: string,
    arrayName: FieldArrayName,
    oldFieldName: string,
    data: FieldData,
) => {
    const setClause: Record<string, unknown> = {
        [`${arrayName}.$[fieldElem].name`]: data.name,
        [`${arrayName}.$[fieldElem].description`]: data.description,
        [`${arrayName}.$[fieldElem].type`]: data.type,
    };
    // Solo se actualiza value si fue enviado en el body
    if ('value' in data) setClause[`${arrayName}.$[fieldElem].value`] = data.value;

    return await Organization.findOneAndUpdate(
        { name: orgName },
        { $set: setClause },
        { arrayFilters: [{ 'fieldElem.name': oldFieldName }], new: true },
    );
};

export const deleteField = async (
    orgName: string,
    arrayName: FieldArrayName,
    fieldName: string,
) => {
    return await Organization.findOneAndUpdate(
        { name: orgName },
        { $pull: { [arrayName]: { name: fieldName } } },
        { new: true },
    );
};
