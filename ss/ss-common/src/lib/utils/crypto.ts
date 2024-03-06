import * as crypto from 'crypto';

export function md5() { return crypto.createHash('md5') }
