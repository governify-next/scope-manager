import { SystemRole } from './systemRole.js';

export interface IUser {
    username: string;
    name: string;
    surname: string;
    email: string;
    password: string;
    status: 'ACTIVE';
    systemRole: SystemRole.USER;
    createdBy: string;
}
