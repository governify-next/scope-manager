import { type Request, type Response, type NextFunction } from 'express';
import {
    ValidationError,
    ForbiddenError,
    LimitError,
    NotFoundError,
    DuplicateKeyError,
} from '../utils/customErrors.js';
import { findMembership } from '../services/membership.service.js';
import { getOrganizationOrFail } from './organization.validator.js';
import Membership from '../models/membership.model.js';
import * as authenticatorIntegration from '../integrations/authenticator.integration.js';
import type { ExpandMode } from '../types/membership.types.js';
import { bootEnv } from '../config/bootConfig.js';
import { Types } from 'mongoose';

// Kept in sync with the defined type so the compiler warns if it is updated
const VALID_EXPAND_VALUES: readonly string[] = ['none', 'full', 'names'] satisfies ExpandMode[];

export const existingMembership = (shouldExist: boolean, source: 'body' | 'params') => {
    return async (req: Request, res: Response, next: NextFunction) => {
        if (!req.params.orgName) return next(new ValidationError('Organization name is required'));
        const username = req[source].username;
        if (!username) return next(new ValidationError('Username is required'));

        try {
            const organization = await getOrganizationOrFail(req.params.orgName);
            const user = await authenticatorIntegration.getUserByUsername(username);

            const membership = await findMembership(organization._id, user._id);

            // To add a user to an org, it should not exist already
            if (membership && !shouldExist)
                return next(
                    new DuplicateKeyError(
                        `The user '${user.username}' already exists in organization '${organization.name}'`,
                    ),
                );
            // To remove a user from an org, it should exist
            if (!membership && shouldExist)
                return next(
                    new NotFoundError(
                        `The user '${user.username}' does not exist in organization '${organization.name}'`,
                    ),
                );

            next();
        } catch (err) {
            next(err);
        }
    };
};

export const hasOrgMembership = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.userAuth?.userId;
    try {
        const organization = await getOrganizationOrFail(req.params.orgName);

        const membership = await findMembership(organization._id, new Types.ObjectId(userId));
        if (!membership)
            return next(
                new ForbiddenError(`You are not a member of organization '${organization.name}'`),
            );
        next();
    } catch (err) {
        next(err);
    }
};

export const maxMembers = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.params.orgName) return next(new ValidationError('Organization name is required'));

    try {
        const max = bootEnv.MAX_MEMBERS_PER_ORGANIZATION;
        const organization = await getOrganizationOrFail(req.params.orgName);
        const count = await Membership.countDocuments({ organizationId: organization._id });
        if (count >= max)
            return next(
                new LimitError(
                    `Organization '${organization.name}' has reached the maximum limit of ${max} members.`,
                ),
            );
        next();
    } catch (err) {
        next(err);
    }
};

export const validateExpand = (req: Request, res: Response, next: NextFunction) => {
    const expand = req.query.expand as string | undefined;
    if (expand && !VALID_EXPAND_VALUES.includes(expand))
        return next(
            new ValidationError(
                `Invalid expand value. Must be one of: ${VALID_EXPAND_VALUES.join(', ')}`,
            ),
        );
    next();
};

// Since an organization must always have an admin, we prevent the requesting user from
// removing themselves, which also satisfies that validation
export const notSelfRemoval = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.params.username) return next(new ValidationError('Username is required'));
    try {
        const user = await authenticatorIntegration.getUserByUsername(req.params.username);
        if (req.userAuth!.userId.toString() === user._id.toString())
            return next(new ForbiddenError('You cannot remove yourself from the organization'));
        next();
    } catch (err) {
        next(err);
    }
};
