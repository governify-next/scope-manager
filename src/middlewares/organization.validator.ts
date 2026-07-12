import { body, validationResult } from 'express-validator';
import { type Request, type Response, type NextFunction } from 'express';
import { Types } from 'mongoose';
import {
    ValidationError,
    DuplicateKeyError,
    LimitError,
    ForbiddenError,
    NotFoundError,
} from '../utils/customErrors.js';
import { getOrganizationByName } from '../services/organization.service.js';
import { findEspecificRole } from '../services/membership.service.js';
import { IOrganization } from '../models/organization.model.js';
import { bootEnv } from '../config/bootConfig.js';
import * as authenticatorIntegration from '../integrations/authenticator.integration.js';

// Helper
export async function getOrganizationOrFail(orgName: string): Promise<IOrganization> {
    const org = await getOrganizationByName(orgName);
    if (!org) throw new NotFoundError(`Organization with name '${orgName}' not found`);
    return org;
}

const nameValidation = (field: string) =>
    body(field)
        .exists({ checkNull: true })
        .withMessage(`${field} is required`)
        .isString()
        .withMessage(`${field} must be a string`)
        .notEmpty()
        .withMessage(`${field} must not be empty`)
        .isLength({ min: 3, max: 100 })
        .withMessage(`${field} must be between 3 and 100 characters`);

const descriptionValidation = (field: string) =>
    body(field)
        .exists({ checkNull: true })
        .withMessage(`${field} is required`)
        .isString()
        .withMessage(`${field} must be a string`)
        .isLength({ min: 3, max: 500 })
        .withMessage(`${field} must be between 3 and 500 characters`);

const typeValidation = (field: string) =>
    body(field)
        .exists({ checkNull: true })
        .withMessage(`${field} is required`)
        .isString()
        .withMessage(`${field} must be a string`)
        .toLowerCase()
        .isIn(['string', 'enum', 'number'])
        .withMessage(`${field} must be one of: string, enum, number`);

const valueValidation = (field: string) => {
    // Extraemos el valor de field 'value'
    return body(field).custom((value, meta) => {
        // Si type es enum
        if (meta.req.body.type === 'enum') {
            // Debe existir value
            if (value === undefined) {
                throw new Error("The 'value' field should be defined if 'type' is 'enum'");
            }
            // Debe ser Array
            if (!Array.isArray(value)) {
                throw new Error("The 'value' field must be defined as a list if 'type' is 'enum'");
            }
        } else {
            if (value !== undefined) {
                throw new Error("The 'value' field should only be defined if 'type' is 'enum'");
            }
        }
        return true;
    });
};

const displayNameValidation = body('displayName')
    .optional()
    .isString()
    .withMessage('displayName must be a string')
    .isLength({ max: 200 })
    .withMessage('displayName must be at most 200 characters');

const orgNameFormat = body('name')
    .matches(/^[a-zA-Z0-9-]+$/)
    .withMessage('Organization name can only contain letters, numbers and hyphens');

export const validateOrganization = [
    nameValidation('name'),
    orgNameFormat,
    displayNameValidation,
    descriptionValidation('description'),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return next(new ValidationError('Validation failed', errors.array()));
        next();
    },
];

export const validateRole = [
    nameValidation('name'),
    descriptionValidation('description'),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return next(new ValidationError('Validation failed', errors.array()));
        next();
    },
];

export const validateField = [
    nameValidation('name'),
    descriptionValidation('description'),
    typeValidation('type'),
    valueValidation('value'),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return next(new ValidationError('Validation failed', errors.array()));
        next();
    },
];

export const existingOrganization = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await getOrganizationOrFail(req.params.orgName);
        next();
    } catch (err) {
        next(err);
    }
};

export const existingRole = (source: 'body' | 'params') => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const roleName = req[source].roleName;
        if (!roleName) return next(new ValidationError('Role name is required'));

        try {
            const organization = await getOrganizationOrFail(req.params.orgName);
            const role = organization.roles.find((r) => r.name === roleName);

            if (!role)
                return next(
                    new NotFoundError(
                        `Role '${roleName}' not found in organization '${organization.name}'`,
                    ),
                );
            next();
        } catch (err) {
            next(err);
        }
    };
};

export const validateExistingRoleNamesBody = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    if (!Array.isArray(req.body)) {
        return next(new ValidationError('Body must be an array of role names'));
    }

    const invalidRoleName = req.body.find((roleName) => typeof roleName !== 'string');
    if (invalidRoleName !== undefined) {
        return next(new ValidationError('Each role name must be a string'));
    }

    const roleNames = req.body as string[];
    const duplicatedRoleName = roleNames.find(
        (roleName, index) => roleNames.indexOf(roleName) !== index,
    );
    if (duplicatedRoleName) {
        return next(new ValidationError(`Role '${duplicatedRoleName}' is duplicated`));
    }

    try {
        const organization = await getOrganizationOrFail(req.params.orgName);
        const organizationRoles = new Set(organization.roles.map((role) => role.name));
        const missingRole = req.body.find((roleName) => !organizationRoles.has(roleName));

        if (missingRole) {
            return next(
                new NotFoundError(
                    `Role '${missingRole}' not found in organization '${organization.name}'`,
                ),
            );
        }

        next();
    } catch (err) {
        next(err);
    }
};

export const creatorMustKeepAdminRole = async (req: Request, res: Response, next: NextFunction) => {
    if (req.body.includes('admin')) return next();

    try {
        const organization = await getOrganizationOrFail(req.params.orgName);
        const user = await authenticatorIntegration.getUserByUsername(req.params.username);

        if (organization.createdBy?.toString() === user._id.toString()) {
            return next(new ForbiddenError('Organization creator must keep the admin role'));
        }

        next();
    } catch (err) {
        next(err);
    }
};

export const existingAgreementField = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const organization = await getOrganizationOrFail(req.params.orgName);
        const field = organization.agreementFields.find((f) => f.name === req.params.fieldName);

        if (!field)
            return next(
                new NotFoundError(
                    `agreementField '${req.params.fieldName}' not found in organization '${organization.name}'`,
                ),
            );
        next();
    } catch (err) {
        next(err);
    }
};

export const uniqueRole = async (req: Request, res: Response, next: NextFunction) => {
    const { roleName } = req.params;
    const newName = req.body.name;
    // Si es update y el nombre no cambió, no hay conflicto
    if (roleName && newName === roleName) return next();

    try {
        const organization = await getOrganizationOrFail(req.params.orgName);
        if (organization.roles.some((r) => r.name === newName))
            return next(
                new DuplicateKeyError(
                    `Role '${newName}' already exists in organization '${organization.name}'`,
                    {},
                ),
            );
        next();
    } catch (err) {
        next(err);
    }
};

export const maxRoles = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const max = bootEnv.MAX_ROLES_PER_ORGANIZATION;
        const organization = await getOrganizationOrFail(req.params.orgName);
        if (organization.roles.length >= max)
            return next(
                new LimitError(
                    `Organization '${organization.name}' has reached the maximum limit of ${max} roles.`,
                ),
            );
        next();
    } catch (err) {
        next(err);
    }
};

export const uniqueAgreementField = async (req: Request, res: Response, next: NextFunction) => {
    const { fieldName } = req.params;
    const newName = req.body.name;
    // Si es update y el nombre no cambió, no hay conflicto
    if (fieldName && newName === fieldName) return next();

    try {
        const organization = await getOrganizationOrFail(req.params.orgName);
        if (organization.agreementFields.some((f) => f.name === newName))
            return next(
                new DuplicateKeyError(
                    `agreementField '${newName}' already exists in organization '${organization.name}'`,
                    {},
                ),
            );
        next();
    } catch (err) {
        next(err);
    }
};

export const hasOrgRole = (roleName: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const organization = await getOrganizationOrFail(req.params.orgName);
            const roleId = organization.roles.find((r) => r.name === roleName)?._id;

            if (!roleId)
                return next(
                    new NotFoundError(
                        `Role '${roleName}' not found in organization '${organization.name}'`,
                    ),
                );

            // Buscamos si el usuario tiene ese rol en la organización
            const hasRole = await findEspecificRole(
                organization._id,
                new Types.ObjectId(req.userAuth!.userId),
                roleId,
            );

            if (!hasRole)
                return next(
                    new ForbiddenError(`You do not have permission to perform that action`),
                );
            next();
        } catch (err) {
            next(err);
        }
    };
};

export const notAdminRole = async (req: Request, res: Response, next: NextFunction) => {
    if (req.params.roleName === 'admin')
        return next(
            new ForbiddenError(`Admin role can not be removed/modified from organizations`),
        );

    next();
};

export const validateSearchOrganizations = [
    body('nameOrDisplayName')
        .optional()
        .isString()
        .withMessage('Name or displayName filter must be a string')
        .isLength({ min: 1, max: 200 })
        .withMessage('Name or displayName filter must be between 1 and 200 characters long'),
    body('name')
        .optional()
        .isString()
        .withMessage('Name filter must be a string')
        .isLength({ min: 1, max: 100 })
        .withMessage('Name filter must be between 1 and 100 characters long'),
    body('displayName')
        .optional()
        .isString()
        .withMessage('DisplayName filter must be a string')
        .isLength({ min: 1, max: 200 })
        .withMessage('DisplayName filter must be between 1 and 200 characters long'),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return next(new ValidationError('Validation failed', errors.array()));
        next();
    },
];
