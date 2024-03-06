import { PathInfo } from "@noah-ark/path-matcher";

export function resolvePath(path: string) {
    const segments = PathInfo.segments(path);
    const view = segments.shift();
    const _path = '/' + segments.join('/');
    return { view, path:_path };
}
