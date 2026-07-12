import Scope, { IScope } from '../models/scope.model.js';
import { Types } from 'mongoose';
import { DuplicateKeyError, NotFoundError } from '../utils/customErrors.js';

export const createScope = async (organizationId: Types.ObjectId, data: Partial<IScope>) => {
    try {
        const scope = new Scope({
            ...data,
            organizationId,
        });
        return await scope.save();
    } catch (err) {
        const e = err as {
            code?: number;
            keyPattern?: { name?: number; organizationId?: number };
            keyValue?: unknown;
            message?: string;
        };
        if (e.code === 11000 && e.keyPattern?.name && e.keyPattern?.organizationId) {
            throw new DuplicateKeyError(
                'An scope with that name already exists in this organization',
                e.keyValue || e.message,
            );
        }
        throw err;
    }
};

export const getScopesByOrganizationId = async (organizationId: Types.ObjectId) => {
    return await Scope.find({ organizationId }).lean();
};

export const getScopeByName = async (organizationId: Types.ObjectId, scopeName: string) => {
    return await Scope.findOne({ organizationId, name: scopeName });
};

export const getScopeById = async (organizationId: Types.ObjectId, scopeId: Types.ObjectId) => {
    return await Scope.findOne({ organizationId, _id: scopeId });
};

export const updateScope = async (
    organizationId: Types.ObjectId,
    scopeName: string,
    data: Partial<IScope>,
) => {
    try {
        return await Scope.findOneAndUpdate({ organizationId, name: scopeName }, data, {
            new: true,
        });
    } catch (err) {
        const e = err as {
            code?: number;
            keyPattern?: { name?: number; organizationId?: number };
            keyValue?: unknown;
            message?: string;
        };
        if (e.code === 11000 && e.keyPattern?.name && e.keyPattern?.organizationId) {
            throw new DuplicateKeyError(
                'An scope with that name already exists in this organization',
                e.keyValue || e.message,
            );
        }
        throw err;
    }
};

export const deleteScopes = async (organizationId: Types.ObjectId, scopeIds: Types.ObjectId[]) => {
    return await Scope.deleteMany({ organizationId, _id: { $in: scopeIds } });
};

export const addRoleToScopePermission = async (
    organizationId: Types.ObjectId,
    scopeName: string,
    permissionName: string,
    roleIds: Types.ObjectId[],
) => {
    const scope = await Scope.findOne({ organizationId, name: scopeName });
    if (!scope) {
        throw new NotFoundError(`Scope with name '${scopeName}' not found in organization`);
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

export const createScopes = async (scopes: IScope[]) => {
    return await Scope.insertMany(scopes);
};

export const getScopesByParentIds = async (
    organizationId: Types.ObjectId,
    parentIds: Types.ObjectId[],
) => {
    return await Scope.find({ organizationId, parentId: { $in: parentIds } })
        .select('_id')
        .lean();
};
