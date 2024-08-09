import { JsonPointer } from "@noah-ark/json-patch";
import { Rule } from "./rule";
import { PathMatcher, TreeBranch } from "@noah-ark/path-matcher";

export class RulesManager {
    private readonly rulesPathMatcher!: PathMatcher<Rule>;
    constructor(readonly rootRule: Rule) {
        this.rulesPathMatcher = new PathMatcher<Rule>(rootRule);
    }


    public get tree(): TreeBranch<Rule> {
        return this.rulesPathMatcher.tree
    }
    public set tree(value: TreeBranch<Rule>) {
        if(value.item?.path !== '/') throw new Error('Root path must be /')
        this.rulesPathMatcher.tree = value;
    }

    get rules() {
        return this.rulesPathMatcher.items()
    }

    get root(): Rule {
        return this.rulesPathMatcher.root;
    }
    set root(root: Rule) {

        this.rulesPathMatcher.root = root;
    }




    updateRootWith(path: string, payload: any) {
        JsonPointer.set(this.root, path, payload);
    }
    updateRule(path: string, rule: Rule) {
        this.rulesPathMatcher.update(path, rule)
    }

    items(path?: string) {
        return this.rulesPathMatcher.items(path)
    }
    get(path: string = '/', fallbackToParent = false) {
        return this.rulesPathMatcher.get(path, fallbackToParent)
    }
    add(path: string, rule: Rule) {
        this.rulesPathMatcher.add(path, rule);
    }

    getRules(path?: string) {
        return this.rulesPathMatcher.items(path ?? '/').map(r => r.item)
    }
    getRule(path?: string, fallbackToParent = false): Rule | undefined {
        return this.rulesPathMatcher.get(path ?? '/', fallbackToParent)
    }

    addRule(path: string, rule: Rule) {
        //rule validation (name is required, path is unique,)
        if (!rule.name) throw new Error("Rule name is required");
        const _existingRule = this.rulesPathMatcher.get(path, false);
        if (_existingRule)
            throw new Error(`Rule ${rule.name} already exists at path ${path}`);
        this.rulesPathMatcher.add(path, rule);
    }

    findRuleByName(name: string): Rule | undefined | null {
        return this.getRules().find((r) => r?.name === name);
    }
}