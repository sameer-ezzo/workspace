export function notfound(): any { return { status: 404 }; }
export function bad(message: string): any { return { status: 400, message }; }
export function forbidden(): any { return { status: 403 }; }