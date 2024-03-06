export function __secret() {
    return process.env.secret ?? process.env.SECRET
}