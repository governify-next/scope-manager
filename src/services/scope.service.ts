import * as scopeRepository from '../repositories/scope.repository.js';
import * as organizationService from './organization.service.js';
import { IScope } from '../models/scope.model.js';
import { NotFoundError } from '../utils/customErrors.js';
import { Types } from 'mongoose';
import { IScopeNode, IScopeNodeInput } from '../types/scope.types.js';

export const createScope = async (
    organizationId: Types.ObjectId,
    createdBy: Types.ObjectId,
    data: Partial<IScope>,
) => {
    // TODO: Transform roles of permissions to ids.
    return await scopeRepository.createScope(organizationId, createdBy, data);
};

export const createScopes = async (
    organizationId: Types.ObjectId,
    createdBy: Types.ObjectId,
    roots: IScopeNodeInput[],
) => {
    const scopes = createRecursiveTree(organizationId, createdBy, roots);
    return await scopeRepository.createScopes(scopes);
};

export const getScopesByOrganization = async (organizationId: Types.ObjectId, flat = false) => {
    // 1. Get scopes from organization
    const scopes = await scopeRepository.getScopesByOrganizationId(organizationId);

    // 2. Return them flat if requested
    if (flat) return scopes;

    // 3. Otherwise, Build and return scopes tree
    return buildScopesTree(scopes);
};

export const getScopeById = async (
    organizationId: Types.ObjectId,
    scopeId: string | Types.ObjectId,
) => {
    const scope = await scopeRepository.getScopeById(organizationId, scopeId);
    if (!scope) {
        throw new NotFoundError(`Scope with id '${scopeId}' not found in organization`);
    }

    return scope;
};

export const updateScope = async (
    organizationId: Types.ObjectId,
    scopeId: string | Types.ObjectId,
    data: Partial<IScope>,
) => {
    const { name, description, type, parentId, fields, permissions, config } = data;
    // TODO: Transform roles of permissions to ids.
    return await scopeRepository.updateScope(organizationId, scopeId, {
        name,
        description,
        type,
        parentId,
        fields,
        permissions,
        config,
    });
};

export const deleteScopesByParent = async (
    organizationId: Types.ObjectId,
    scopeId: string | Types.ObjectId,
) => {
    await getScopeById(organizationId, scopeId);
    const scopeIds = await collectDescendantIds(organizationId, scopeId);

    return await scopeRepository.deleteScopes(organizationId, scopeIds);
};

export const addRoleToScopePermission = async (
    organizationId: Types.ObjectId,
    scopeId: string | Types.ObjectId,
    permissionName: string,
    roleNames: string[],
) => {
    await getScopeById(organizationId, scopeId);

    const organization = await organizationService.getOrganizationById(
        new Types.ObjectId(organizationId.toString()),
    );

    const roleIds = roleNames.map((roleName) => {
        const role = organization!.roles.find((r) => r.name === roleName);
        if (!role) {
            throw new NotFoundError(`Role '${roleName}' not found in organization`);
        }
        return role._id!;
    });

    if (!['view', 'edit', 'delete', 'create'].includes(permissionName)) {
        throw new NotFoundError(`Permission '${permissionName}' not found on scope`);
    }

    return await scopeRepository.addRoleToScopePermission(
        organizationId,
        scopeId,
        permissionName,
        roleIds,
    );
};

// Logic internal methods

// Returns the scope and all its descendants, walking the tree level by level.
const collectDescendantIds = async (
    organizationId: Types.ObjectId,
    scopeId: string | Types.ObjectId,
) => {
    const scopeIds = [scopeId];
    let parentIds = [scopeId];

    while (parentIds.length > 0) {
        const children = await scopeRepository.getScopesByParentIds(organizationId, parentIds);
        parentIds = children.map((child) => child._id);
        scopeIds.push(...parentIds);
    }

    return scopeIds;
};

const createRecursiveTree = (
    organizationId: Types.ObjectId,
    createdBy: Types.ObjectId,
    nodes: IScopeNodeInput[],
    scopes: Partial<IScope>[] = [],
    parentId: Types.ObjectId | null = null,
) => {
    // 1. For each node
    for (const node of nodes) {
        // 2. Create an id and assign the organization
        const nodeId = new Types.ObjectId();
        // 3. Add the node as scope to create.
        //    fields and permissions are only handled from the individual scope endpoints.
        const { name, description, type, config } = node;
        scopes.push({
            name,
            description,
            type,
            config,
            _id: nodeId,
            organizationId,
            createdBy,
            parentId,
        });
        // 4. Pass identifier to children by recursion, if it has children.
        createRecursiveTree(organizationId, createdBy, node.children, scopes, nodeId);
    }
    return scopes;
};

const buildScopesTree = (scopes: IScope[]) => {
    // 1. For each scope, add an empty children array and add it to a map by its id.
    const scopesMap = new Map<string, IScopeNode>();
    for (const scope of scopes) {
        scopesMap.set(scope._id.toString(), { ...scope, children: [] });
    }

    // 2. For each scope, if it has a parentId, add it to the children of the parent. If not, add it to the root nodes array.
    const scopesRoot = [];
    for (const node of scopesMap.values()) {
        if (node.parentId !== null) {
            const parent = scopesMap.get(node.parentId.toString());
            parent!.children.push(node);
        } else {
            scopesRoot.push(node);
        }
    }

    // 3. Return the root nodes array.
    return scopesRoot;
};
