import * as scopeRepository from '../repositories/scope.repository.js';
import * as organizationService from './organization.service.js';
import { IScope } from '../models/scope.model.js';
import { NotFoundError } from '../utils/customErrors.js';
import { Types } from 'mongoose';
import { IScopeNode } from '../types/scope.types.js';

export const createScope = async (organizationId: Types.ObjectId, data: Partial<IScope>) => {
    return await scopeRepository.createScope(organizationId, data);
};

// TODO: Add unique name between parent's children, not just in organization.
// TODO: Add displayName to scope.
export const createScopes = async (organizationId: Types.ObjectId, roots: IScopeNode[]) => {
    const scopes = createRecursiveTree(organizationId, roots);
    return await scopeRepository.createScopes(scopes);
};

export const getScopesByOrganization = async (organizationId: Types.ObjectId) => {
    // 1. Get scopes from organization
    const scopes = await scopeRepository.getScopesByOrganizationId(organizationId);

    // 2. Build scopes tree
    const scopesTree = buildScopesTree(scopes);

    // 3. Return scopes tree
    return scopesTree;
};

export const getScopeByName = async (organizationId: Types.ObjectId, scopeName: string) => {
    const scope = await scopeRepository.getScopeByName(organizationId, scopeName);
    if (!scope) {
        throw new NotFoundError(`Scope with name '${scopeName}' not found in organization`);
    }

    return scope;
};

export const getScopeById = async (organizationId: Types.ObjectId, scopeId: Types.ObjectId) => {
    const scope = await scopeRepository.getScopeById(organizationId, scopeId);
    if (!scope) {
        throw new NotFoundError(`Scope with id '${scopeId}' not found in organization`);
    }

    return scope;
};

export const updateScope = async (
    organizationId: Types.ObjectId,
    scopeName: string,
    data: Partial<IScope>,
) => {
    const { name, description, auditConfig } = data;
    const scope = await scopeRepository.updateScope(organizationId, scopeName, {
        name,
        description,
        auditConfig,
    });
    if (!scope) {
        throw new NotFoundError(`Scope with name '${scopeName}' not found in organization`);
    }

    return scope;
};

export const deleteScopesByParent = async (organizationId: Types.ObjectId, scopeName: string) => {
    const scope = await scopeRepository.getScopeByName(organizationId, scopeName);
    if (!scope) {
        throw new NotFoundError(`Scope with name '${scopeName}' not found in organization`);
    }

    const scopeIds = await collectDescendantIds(organizationId, scope._id);

    return await scopeRepository.deleteScopes(organizationId, scopeIds);
};

export const addRoleToScopePermission = async (
    organizationId: Types.ObjectId,
    scopeName: string,
    permissionName: string,
    roleNames: string[],
) => {
    const scope = await getScopeByName(organizationId, scopeName);
    if (!scope) {
        throw new NotFoundError(`Scope with name '${scopeName}' not found in organization`);
    }

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
        scopeName,
        permissionName,
        roleIds,
    );
};

// Logic internal methods

// Devuelve el scope y todos sus descendientes, recorriendo el árbol nivel a nivel.
const collectDescendantIds = async (organizationId: Types.ObjectId, scopeId: Types.ObjectId) => {
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
    nodes: IScopeNode[],
    scopes: IScope[] = [],
    parentId?: Types.ObjectId,
) => {
    // 1. For each node
    for (const node of nodes) {
        // 2. Create an id and assign the organization
        const nodeId = new Types.ObjectId();
        // 3. Add the node as scope to create
        const { children, ...scopeData } = node;
        scopes.push({ ...scopeData, _id: nodeId, organizationId, parentId });
        // 4. Pass identifier to children by recursion, if it has children.
        createRecursiveTree(organizationId, children, scopes, nodeId);
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
        if (node.parentId !== undefined) {
            const parent = scopesMap.get(node.parentId!.toString());
            parent!.children.push(node);
        } else {
            scopesRoot.push(node);
        }
    }

    // 3. Return the root nodes array.
    return scopesRoot;
};
