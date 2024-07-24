export type UpHierarchy<T> = { node: T, parent?: UpHierarchy<T> }
export type DownHierarchy<T> = { node: T, children?: DownHierarchy<T>[] }
export type FlatHierarchy<T> = { [key: string]: FlatHierarchy<T> | (T & Record<string, any>) } | T;

export type MatchItem<T> = { segment: string, item: T | undefined }
export type PathMatch<T> = {
    path: string
    segments: string[]
    matches: [MatchItem<T>, ...MatchItem<T>[]]
    values: Record<string, string>
}

export type TreeBranch<T> = {
    item?: T | null //if item is undefined that indeicates that the tree branch is created just for nesting purpose
    children: { [segment: string]: TreeBranch<T> }
}

export class PathMatcher<T extends object> {

    private readonly _items = new Map<string, T | null>()

    items(path?: string): { path: string, item: T | null }[] {
        const p: string = path?.trim().length ? path : '/'
        return Array.from(this._items).filter(e => e[0].startsWith(p)).map(e => ({ path: e[0], item: e[1] }))
    }


    private readonly pathTree!: { ["/"]: TreeBranch<T> }

    public get tree(): TreeBranch<T> {
        return this.pathTree['/'];
    }
    public set tree(value: TreeBranch<T>) {
        this.pathTree["/"] = value;
    }
    
    constructor(root: T) {
        this.pathTree = { ["/"]: { item: root, children: {} } }
        this._items.set('/', root)
    }

    get root(): T { return this.pathTree['/'].item as T }
    set root(root: T) {
        this.pathTree["/"].item = root
    }

    match(path: string): PathMatch<T> {
        const segments = path.split('/').filter(x => x)
        const rootMatch = { item: this.pathTree["/"].item!, segment: '/' }//root is the catch all match
        const result: PathMatch<T> = { matches: [rootMatch], values: {}, path, segments: segments.slice() }

        let segment = segments.shift()
        let current = this.pathTree["/"]

        while (segment) {
            const sub = current.children[segment]

            if (sub) current = sub
            else {
                const keys = Object.keys(current.children).filter((k: string) => k.startsWith(':'))
                if (keys && keys.length === 1) {
                    const key = keys[0]
                    const sub = current.children[key]
                    current = sub
                    result.values[key] = segment
                }
                else break
            }

            if (current.item != null) result.matches.push({ item: current.item, segment })
            segment = segments.shift()
        }

        return result
    }

    remove(path: string, releaseChildren = false): void {
        if (!path) throw `Can not remove path: ${path}`
        if (!this._items.has(path)) throw `Path: ${path} does not exist`

        if (path === "/") {
            if (releaseChildren) {
                this.pathTree["/"] = { item: null, children: {} }
                this._items.clear()
            }
            else {
                this.pathTree["/"].item = null
                this._items.delete(path)
            }
        }
        else {
            let current = this.pathTree["/"]
            const segments = path.split("/").filter(s => s)
            let fullPath = ''
            while (segments.length) {
                const segment = segments.shift()!
                fullPath = `/${fullPath}/${segment}`
                if (segments.length == 0) {
                    if (releaseChildren) {
                        delete current.children[segment]
                        Array.from(this._items).filter(e => e[0].startsWith(fullPath)).forEach(e => this._items.delete(e[0]))
                    }
                    else {
                        current.children[segment] = { item: null, children: current.children[segment]?.children ?? {} }
                        this._items.delete(fullPath)
                    }
                }

                current = current.children[segment]
            }
        }


        if (releaseChildren) Array.from(this._items).filter(e => e[0].startsWith(path)).forEach(e => this._items.delete(e[0]))
        else this._items.delete(path)
    }

    add(path: string, item: T): void {
        if (!path) throw `Can not add path: ${path}`
        if (this._items.has(path)) 
        {
            console.warn(`Path: ${path} already exists`)
            return
        }


        let current = this.pathTree["/"]
        const segments = path.split("/").filter(s => s)

        let fullPath = ''
        while (segments.length) {
            const segment = segments.shift()!
            fullPath += `/${segment}`
            if (segments.length == 0) {
                current.children[segment] = { item, children: current.children[segment]?.children ?? {} }
                this._items.set(fullPath, item)
            }
            else if (!current.children[segment]) {
                current.children[segment] = { children: {} }
                this._items.set(fullPath, null)
            }


            current = current.children[segment]
        }

    }

    update(path: string, item: T, releaseChildren = false): void {
        if (!path) throw `Can not update path: ${path}`
        if (!this._items.has(path)) throw `Path ${path} does not exist`

        this.remove(path, releaseChildren)
        this.add(path, item)
    }


    get(path: string, fallbackToParents = true) {
        const m = this.match(path)
        const last = m.matches.pop()!.item
        if (fallbackToParents) return last
        else if (m.matches.length === m.segments.length) return last
        else return undefined
    }
}

// console.clear()

// type Rule = { rule: string }
// let m = new PathMatcher<Rule>({ rule: 'R0' })
// m.add('/prefix/path', { rule: 'R1' })
// console.log('Simple Match:', m.get('/prefix/path', false)?.rule === 'R1')

// m = new PathMatcher<Rule>({ rule: 'R0' })
// console.log('No Match:', m.get('/prefix/path1', false)?.rule === undefined)

// m = new PathMatcher<Rule>({ rule: 'R0' })
// m.add('/prefix/path', { rule: 'R1' })
// console.log('Direct Match:', m.get('/prefix/path/1', false)?.rule === undefined)

// m = new PathMatcher<Rule>({ rule: 'R0' })
// m.add('/prefix/path', { rule: 'R1' })
// m.add('/prefix/path/:id', { rule: 'R2' })
// let r = m.get('/prefix/path/1', false)
// console.log('Variable Match:', r?.rule === 'R2' && r.)


// m1.add('/test/fun/:id', { rule: 'id' })
// m1.add('/test/fun/:id/:coco', { rule: 'id2' })
// m1.add('/test/fun/:id', { rule: 'xx' })



// console.log('test 1', m1.get('/test/fun/2/samir', false)?.rule === 'id2')