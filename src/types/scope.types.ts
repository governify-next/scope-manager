import { IScope } from '../models/scope.model.js';

export interface IScopeNode extends IScope {
    children: IScopeNode[];
}
