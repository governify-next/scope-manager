import { Request, Response, NextFunction } from 'express';
import * as scopeService from '../services/scope.service.js';
import * as organizationService from '../services/organization.service.js';
import { sendSuccess } from '../utils/standardResponse.js';
import { Types } from 'mongoose';
import { ValidationError } from '../utils/customErrors.js';

const resolveCreatedBy = (req: Request) => {
    const createdBy = req.userAuth?.userId ?? req.body.createdBy;
    if (!createdBy || !Types.ObjectId.isValid(createdBy)) {
        throw new ValidationError('A valid createdBy user is required');
    }
    return new Types.ObjectId(createdBy);
};

export const createScope = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const organization = await organizationService.getOrganizationByName(req.params.orgName);
        const scope = await scopeService.createScope(
            organization!._id,
            resolveCreatedBy(req),
            req.body,
        );
        return sendSuccess(res, {
            data: scope,
            httpStatus: 201,
            message: 'Scope created',
        });
    } catch (err) {
        next(err);
    }
};

export const createScopes = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const organization = await organizationService.getOrganizationByName(req.params.orgName);
        const scopes = await scopeService.createScopes(
            organization!._id,
            new Types.ObjectId(req.userAuth!.userId),
            req.body,
        );
        return sendSuccess(res, {
            data: scopes,
            httpStatus: 201,
            message: 'Scopes created',
        });
    } catch (err) {
        next(err);
    }
};

export const getScopesByOrganization = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const organization = await organizationService.getOrganizationByName(req.params.orgName);
        const flat = req.query.flat === 'true';
        const scopes = await scopeService.getScopesByOrganization(organization!._id, flat);
        return sendSuccess(res, { data: scopes });
    } catch (err) {
        next(err);
    }
};

export const getScopeById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const organization = await organizationService.getOrganizationByName(req.params.orgName);
        const scope = await scopeService.getScopeById(organization!._id, req.params.scopeId);
        return sendSuccess(res, { data: scope });
    } catch (err) {
        next(err);
    }
};

export const updateScope = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const organization = await organizationService.getOrganizationByName(req.params.orgName);
        const scope = await scopeService.updateScope(
            organization!._id,
            req.params.scopeId,
            req.body,
        );
        return sendSuccess(res, { data: scope, message: 'Scope updated' });
    } catch (err) {
        next(err);
    }
};

export const deleteScopesByParent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const organization = await organizationService.getOrganizationByName(req.params.orgName);
        await scopeService.deleteScopesByParent(organization!._id, req.params.scopeId);
        return sendSuccess(res, { data: null, message: 'Scope deleted' });
    } catch (err) {
        next(err);
    }
};

export const addRoleToScopePermission = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const organization = await organizationService.getOrganizationByName(req.params.orgName);
        const scope = await scopeService.addRoleToScopePermission(
            organization!._id,
            req.params.scopeId,
            req.params.permissionName,
            req.body.roles,
        );
        return sendSuccess(res, {
            data: scope,
            message: 'Role added to scope permission',
        });
    } catch (err) {
        next(err);
    }
};
