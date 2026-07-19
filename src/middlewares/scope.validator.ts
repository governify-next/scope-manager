import { body, validationResult } from 'express-validator';
import { type Request, type Response, type NextFunction } from 'express';
import { ValidationError, NotFoundError } from '../utils/customErrors.js';
import * as organizationService from '../services/organization.service.js';
import * as scopeService from '../services/scope.service.js';
import { getOrganizationOrFail } from './organization.validator.js';

const validateScopeFields = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { fields } = req.body;
        const organization = await organizationService.getOrganizationByName(req.params.orgName);

        if (!fields || !Array.isArray(fields)) {
            return next();
        }

        const scopeFieldsMap = new Map(organization!.scopeFields.map((sf) => [sf.name, sf]));

        const validationErrors = [];
        const notFoundErrors = [];

        // Validate each object in the fields array
        for (let i = 0; i < fields.length; i++) {
            const fieldObj = fields[i];

            if (!fieldObj || typeof fieldObj !== 'object' || Array.isArray(fieldObj)) {
                validationErrors.push({
                    msg: `fields[${i}] must be an object`,
                    path: `fields[${i}]`,
                });
                continue;
            }

            if (!scopeFieldsMap.has(fieldObj.name)) {
                notFoundErrors.push({
                    msg: `Field named '${fieldObj.name}' is not defined in organization's scopeFields`,
                    path: `fields[${i}]`,
                });
            }
        }

        if (validationErrors.length > 0) {
            return next(new ValidationError('Field validation failed', validationErrors));
        }

        if (notFoundErrors.length > 0) {
            return next(new NotFoundError('Scope field not found in organization', notFoundErrors));
        }

        next();
    } catch (err) {
        next(err);
    }
};

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
        .optional()
        .isString()
        .withMessage('description must be a string')
        .isLength({ min: 3, max: 500 })
        .withMessage('description must be between 3 and 500 characters'),
    body('type')
        .exists({ checkNull: true })
        .withMessage('type is required')
        .isString()
        .withMessage('type must be a string'),
    body('fields').exists({ checkNull: true }).isArray().withMessage('fields must be an array'),
    body('permissions')
        .exists({ checkNull: true })
        .isObject()
        .withMessage('permissions must be an object'),
    body('config').exists({ checkNull: true }).isObject().withMessage('config must be an object'),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return next(new ValidationError('Validation failed', errors.array()));
        }
        next();
    },
    validateScopeFields,
    validateScopePermissions,
];
