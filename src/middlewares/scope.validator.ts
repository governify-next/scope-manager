import { body, validationResult } from 'express-validator';
import { type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { ValidationError, NotFoundError } from '../utils/customErrors.js';
import * as organizationService from '../services/organization.service.js';
import * as scopeService from '../services/scope.service.js';
import { getOrganizationOrFail } from './organization.validator.js';
import type { IField, IScopeConfig, IScopeType } from '../types/organization.types.js';
import { IScopeNode } from '../types/scope.types.js';

const validateScopePermissions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { permissions } = req.body;
        const organization = await organizationService.getOrganizationByName(req.params.orgName);

        if (!permissions || typeof permissions !== 'object') {
            return next();
        }

        const organizationRoles = new Set(organization!.roles.map((r) => r.name));

        const validationErrors = [];
        const notFoundErrors = [];

        // Validate each permission type
        for (const [permType, rolesList] of Object.entries(permissions)) {
            if (!Array.isArray(rolesList)) {
                validationErrors.push({
                    msg: `Permission '${permType}' must be an array of role names`,
                    path: `permissions.${permType}`,
                    value: rolesList,
                });
                continue;
            }

            // Check each role exists in organization
            for (const roleName of rolesList) {
                if (typeof roleName !== 'string') {
                    validationErrors.push({
                        msg: `Role name in '${permType}' must be a string`,
                        path: `permissions.${permType}`,
                        value: roleName,
                    });
                    continue;
                }

                if (!organizationRoles.has(roleName)) {
                    notFoundErrors.push({
                        msg: `Role '${roleName}' does not exist in organization`,
                        path: `permissions.${permType}`,
                        value: roleName,
                    });
                }
            }
        }

        if (validationErrors.length > 0) {
            return next(new ValidationError('Permission validation failed', validationErrors));
        }

        if (notFoundErrors.length > 0) {
            return next(
                new NotFoundError('Permission role not found in organization', notFoundErrors),
            );
        }

        next();
    } catch (err) {
        next(err);
    }
};

export const existingScope = (checkParent = false) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const organization = await getOrganizationOrFail(req.params.orgName);
            let scope;
            if (checkParent) {
                const parentId = req.body.parentId;
                if (!parentId) return next(); // is a root scope, no need validation
                scope = await scopeService.getScopeById(organization._id, parentId);
            } else {
                scope = await scopeService.getScopeByName(organization._id, req.params.scopeName);
            }
            if (!scope) {
                return next(
                    new NotFoundError(`Scope not found in organization '${req.params.orgName}'`),
                );
            }
            next();
        } catch (err) {
            next(err);
        }
    };
};

export const validateScopePermissionRoles = [
    body('roles')
        .exists({ checkNull: true })
        .withMessage('roles is required')
        .isArray({ min: 1 })
        .withMessage('roles must be a non-empty array of role names'),
    body('roles.*').isString().withMessage('each role must be a string'),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return next(new ValidationError('Validation failed', errors.array()));
        }
        next();
    },
];

export const validateScope = [
    body('name')
        .exists({ checkNull: true })
        .withMessage('name is required')
        .isString()
        .withMessage('name must be a string')
        .notEmpty()
        .withMessage('name must not be empty')
        .isLength({ min: 2, max: 100 })
        .withMessage('name must be between 2 and 100 characters'),
    body('description')
        .exists({ checkNull: true })
        .withMessage('description is required')
        .isString()
        .withMessage('description must be a string')
        .isLength({ min: 3, max: 500 })
        .withMessage('description must be between 3 and 500 characters'),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return next(new ValidationError('Validation failed', errors.array()));
        }
        next();
    },
];

const buildAuditSchema = (auditFields: IField[]) => {
    const shape: Record<string, z.ZodType> = {};
    for (const field of auditFields) {
        shape[field.name] =
            field.type === 'number'
                ? z.number()
                : field.type === 'enum'
                  ? z.enum(field.value as [string, ...string[]])
                  : z.string();
    }
    // Strict means that an auditConfig with keys not declared in the grammar is rejected.
    return z.strictObject(shape);
};

const findScopeType = (scopeConfig: IScopeConfig, typeName: string) =>
    scopeConfig.scopeTypes.find((scopeType) => scopeType.name === typeName);

const validateAuditConfig = (scopeType: IScopeType, auditConfig?: Record<string, unknown>) => {
    const result = buildAuditSchema(scopeType.auditFields).safeParse(auditConfig ?? {});
    if (!result.success) {
        throw new ValidationError(
            `Invalid auditConfig for type '${scopeType.name}'`,
            result.error.issues,
        );
    }
};

const validateScopeAgainstGrammar = (
    scopeConfig: IScopeConfig,
    scope: Pick<IScopeNode, 'type' | 'auditConfig'>,
    parentType?: string,
) => {
    const scopeType = findScopeType(scopeConfig, scope.type);
    if (!scopeType) {
        throw new ValidationError(`Type '${scope.type}' is not declared in the organization`);
    }
    // A root scope is validated against rootTypes. The rest, against the childTypes of its parent.
    const allowedTypes = parentType
        ? (findScopeType(scopeConfig, parentType)?.childTypes ?? [])
        : scopeConfig.rootTypes;

    if (!allowedTypes.includes(scope.type)) {
        throw new ValidationError(
            parentType
                ? `Type '${scope.type}' is not allowed under type '${parentType}'`
                : `Type '${scope.type}' is not allowed as a root scope`,
        );
    }

    validateAuditConfig(scopeType, scope.auditConfig);
};

export const validateScopeGrammar = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { type, parentId } = req.body;
        if (typeof type !== 'string') {
            return next(new ValidationError('type is required and must be a string'));
        }

        const organization = await getOrganizationOrFail(req.params.orgName);
        // getScopeById lanza NotFoundError si el padre no existe en la organización.
        const parent = parentId
            ? await scopeService.getScopeById(organization._id, parentId)
            : undefined;

        validateScopeAgainstGrammar(organization.scopeConfig, req.body, parent?.type);
        next();
    } catch (err) {
        next(err);
    }
};

export const validateScopeAuditConfig = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const organization = await getOrganizationOrFail(req.params.orgName);
        const scope = await scopeService.getScopeByName(organization._id, req.params.scopeName);

        const scopeType = findScopeType(organization.scopeConfig, scope.type);
        if (!scopeType) {
            throw new ValidationError(`Type '${scope.type}' is not declared in the organization`);
        }

        validateAuditConfig(scopeType, req.body.auditConfig);
        next();
    } catch (err) {
        next(err);
    }
};

const validateScopeNodes = (
    scopeConfig: IScopeConfig,
    nodes: IScopeNode[],
    parentType?: string,
) => {
    for (const node of nodes) {
        validateScopeAgainstGrammar(scopeConfig, node, parentType);

        if (!Array.isArray(node.children)) {
            throw new ValidationError(
                `Scope '${node.name}' must declare a children array, empty if it is a leaf`,
            );
        }

        validateScopeNodes(scopeConfig, node.children, node.type);
    }
};

export const validateScopesTreeGrammar = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        if (!Array.isArray(req.body)) {
            return next(new ValidationError('Body must be an array of scopes'));
        }

        const organization = await getOrganizationOrFail(req.params.orgName);
        validateScopeNodes(organization.scopeConfig, req.body);
        next();
    } catch (err) {
        next(err);
    }
};
