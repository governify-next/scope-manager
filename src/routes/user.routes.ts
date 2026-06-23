import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import { validateCreateUser, validateLogin } from '../middlewares/user.validator.js';
import { validateOidcEnabled } from '../middlewares/oidc.validator.js';
import { checkUserAuthentication, hasRole } from '../middlewares/user.authenticator.js';
import { SystemRole } from '../types/systemRole.js';

export const userRoutes = Router();

userRoutes.get(
    '/users/',
    checkUserAuthentication,
    hasRole(SystemRole.ADMIN),
    userController.getUsers,
);

userRoutes.get(
    '/users/:username',
    checkUserAuthentication,
    hasRole(SystemRole.ADMIN),
    userController.getUserByUsername,
);

userRoutes.post('/users/', validateCreateUser, userController.createUser);

userRoutes.put(
    '/users/:username',
    checkUserAuthentication,
    hasRole(SystemRole.ADMIN),
    validateCreateUser,
    userController.updateUser,
);

userRoutes.delete(
    '/users/:username',
    checkUserAuthentication,
    hasRole(SystemRole.ADMIN),
    userController.deleteUser,
);

userRoutes.post('/users/login', validateLogin, userController.login);

userRoutes.post('/users/oidc/login', validateOidcEnabled, userController.oidcLogin);
userRoutes.get('/users/oidc/callback', validateOidcEnabled, userController.oidcCallback);
userRoutes.get('/users/:username/organizations', userController.getOrgsUserBelongs);
