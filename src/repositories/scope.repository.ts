import Scope, { IScope } from '../models/scope.model.js';
import { Types } from 'mongoose';
import { NotFoundError } from '../utils/customErrors.js';

export const createScope = async (
    organizationId: Types.ObjectId,
    createdBy: Types.ObjectId,
    data: Partial<IScope>,
) => {
    const scope = new Scope({
        ...data,
        organizationId,
        createdBy,
    });
    return await scope.save();
};

export const getScopesByOrganizationId = async (organizationId: Types.ObjectId) => {
    return await Scope.find({ organizationId }).lean();
};

export const getScopeById = async (
    organizationId: Types.ObjectId,
    scopeId: string | Types.ObjectId,
) => {
    return await Scope.findOne({ organizationId, _id: scopeId });
};

export const updateScope = async (
    organizationId: Types.ObjectId,
    scopeId: string | Types.ObjectId,
    data: Partial<IScope>,
) => {
    return await Scope.findOneAndUpdate({ organizationId, _id: scopeId }, data, {
        new: true,
    });
};

export const deleteScopes = async (
    organizationId: Types.ObjectId,
    scopeIds: (string | Types.ObjectId)[],
) => {
    return await Scope.deleteMany({ organizationId, _id: { $in: scopeIds } });
};

export const addRoleToScopePermission = async (
    organizationId: Types.ObjectId,
    scopeId: string | Types.ObjectId,
    permissionName: string,
    roleIds: Types.ObjectId[],
) => {
    const scope = await Scope.findOne({ organizationId, _id: scopeId });
    if (!scope) {
        throw new NotFoundError(`Scope with id '${scopeId}' not found in organization`);
    }

    const permission = scope.permissions[permissionName as keyof typeof scope.permissions]; // this was checked before
    if (!permission) {
        throw new NotFoundError(`Permission '${permissionName}' not found on scope`);
    }

    for (const roleId of roleIds) {
        if (!permission.includes(roleId)) {
            permission.push(roleId);
        }
    }

    await scope.save();
    return scope;
};

export const createScopes = async (scopes: Partial<IScope>[]) => {
    return await Scope.insertMany(scopes);
};

export const getScopesByParentIds = async (
    organizationId: Types.ObjectId,
    parentIds: (string | Types.ObjectId)[],
) => {
    return await Scope.find({ organizationId, parentId: { $in: parentIds } })
        .select('_id')
        .lean();
};
