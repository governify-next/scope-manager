import { IScope } from '../models/scope.model.js';

export interface IScopeNode extends IScope {
    children: IScopeNode[];
}

export interface IScopeNodeInput extends Pick<IScope, 'name' | 'description' | 'type' | 'config'> {
    children: IScopeNodeInput[];
}
