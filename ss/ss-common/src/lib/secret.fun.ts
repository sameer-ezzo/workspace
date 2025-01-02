export function _env_secret() {
    return process.env['secret'] ?? process.env['SECRET']
}