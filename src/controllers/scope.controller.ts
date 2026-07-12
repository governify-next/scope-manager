import { Request, Response, NextFunction } from 'express';
import * as scopeService from '../services/scope.service.js';
import * as organizationService from '../services/organization.service.js';
import { sendSuccess } from '../utils/standardResponse.js';

export const createScope = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const organization = await organizationService.getOrganizationByName(req.params.orgName);
        const scope = await scopeService.createScope(organization!._id, req.body);
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
        const scopes = await scopeService.createScopes(organization!._id, req.body);
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
        const scopes = await scopeService.getScopesByOrganization(organization!._id);
        return sendSuccess(res, { data: scopes });
    } catch (err) {
        next(err);
    }
};

export const getScopeByName = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const organization = await organizationService.getOrganizationByName(req.params.orgName);
        const scope = await scopeService.getScopeByName(organization!._id, req.params.scopeName);
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
            req.params.scopeName,
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
        await scopeService.deleteScopesByParent(organization!._id, req.params.scopeName);
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
            req.params.scopeName,
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
