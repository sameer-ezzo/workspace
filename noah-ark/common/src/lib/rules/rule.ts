import { AccessType, AuthorizeFun, Permission } from "./permission";
/**
 * @description Rule object is a collection of permissions and a default authorization per path/action. So ideally a system should have a rule per endpoint. Rules are structured as a tree so if a path does not match a rule then the parent rule is used.
 */
export class Rule {
    constructor(public name: string) { }

    /**
     * @description incoming message (request) path pattern to run the authorization against. Same pattern as express router.
     */
    path: string;

    /**
     * @description If permissions did not match then this is the default authorization (permissions could not match in case the action is not present or the authorize function returned false returned undefiled)
    */
    fallbackAuthorization: AccessType = 'deny'; //TODO add the option to fallback to parent rule

    /**
     * @description list of permissions to be checked against the path
    */
    actions?: { [action: string]: Permission<boolean | AuthorizeFun>[] } = {}
    builtIn? = true //TODO this should be replaced by tags
}

// export type RuleRecord = Rule<ExpressionSet> & { _id: string, path: string; }


// export type RuleVm = {
//     name: string;
//     actions: string[];
//     permissions: { [name: string]: Permission<boolean> };
// }




//hybrid case (sub path) ex: /api = endpoint but locally /api/collection1 is not the same as /api/collection2 but collections are also fixed by design (for most most most cases)
//even query rules (ownership) can be considered fixed by design (can a user define ownership between properties that are not mean to be related ???)




/*
const actions = {
        read: [ //simple permission is not boolean it returns "$access" if condition is true other wise return undefined
            { left: 'roles', operator: 'has', right: ['admin'] , db: {actions:'read',rule:'assets'} }, //permission as expression
            { type: 'role', value: 'admin' },
            { type: 'claim', value: { location: 'ist' } },
            { type: 'email', value: 'rami@gmail.com', access: 'deny' } //access is options and grant by default
        ],
        write: {
            type: 'email',
            value: 'rami@gmail.com',
        }
    }

*/
// const rule = {
//     name: 'asset', builtIn: false, fallbackAuthorization: 'grant', path: '/api/asset',
//     actions: {
//         read: [
//             { $in: ['/roles', ['manager']] } as SymPer
//         ]
//     }
// } as Rule

// Multi-layer Store

// Consolidate -> Read from code + read from DB -> Cons
// RuleStore -> Change
