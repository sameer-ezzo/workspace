
export type MinMax = [number, number]
export class PasswordStrength {
    length: number | MinMax = [8, 20]
    lower: number | MinMax = 1
    upper: number | MinMax = 1
    special: number | MinMax = 1
    digit: number | MinMax = 1
}

const lower = "abcdefghijklmnopqrstuvwxyz"
const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
const special = " !\"#$%&'()*+,-./:<=>?@[]^_`{|}~"
const digit = "0123456789"
const charsGroups: { [group: string]: string } = {
    lower,
    upper,
    special,
    digit
}

export function analyzePassword(password: string) {
    const result: { [group: string]: number } = Object.getOwnPropertyNames({ ...charsGroups, length: 0, other: 0 })
        .map(p => ({ [p]: 0 })).reduce((p1, p2) => ({ ...p1, ...p2 }), {})

    password ??= ""
    if (password.length === 0) return result

    let found = 0
    for (const g in charsGroups) result[g] = 0
    if (password) {
        for (const c of password) {
            for (const g in charsGroups) {
                if (charsGroups[g].indexOf(c) > -1) {
                    result[g]++
                    found++
                    break
                }
            }
        }
    }
    result['length'] = password.length
    result['other'] = result['length'] - found

    return result
}
export function generatePassword(pwdStrength?: PasswordStrength): string {
    const strength = { ...(pwdStrength ?? new PasswordStrength()) }
    const { length } = pwdStrength
    delete strength.length
    const pick = (from: string) => {
        const s = Math.floor(Math.random() * (from.length + 1))
        return from.substring(s, s + 1)
    }

    const [minLength, maxLength] = Array.isArray(length) ? length : [length, length]
    let _max = 0
    let _min = 0

    const generators: Partial<Record<'upper' | 'special' | 'digit', { range: [number, number], chars: string[] }>> =
        Object.entries(pwdStrength).filter(x => x[0] in charsGroups).map(x => {
            const a = [x[0], charsGroups[x[0]]]
            const s = strength[a[0]]
            const [min, max] = Array.isArray(s) ? s : [s, s]
            _max += max
            _min += min
            const chars = new Array(max).fill(charsGroups[a[0]][0]).map((x, i) => pick(charsGroups[a[0]]))
            return { [a[0]]: { range: [min, max], chars } }
        }).reduce((a, b) => ({ ...a, ...b }), {})


    let chars = Object.entries(generators).map(c => (c[1].chars.join(''))).join('')

    const MIN = Math.max(minLength, _min)

    while (chars.length < MIN) {
        chars += pick(lower)
    }

    return chars.split('').sort((c1, c2) => Math.random() - Math.random()).join('')
}

export function verifyPassword(password: string) {
    const result: { [group: string]: number, length?: number, other?: number } = {};
    let found = 0;
    for (let g in charsGroups) result[g] = 0;
    if (password != null) {
        for (let c of password) {
            for (let g in charsGroups) {
                if (charsGroups[g].indexOf(c) > -1) {
                    result[g]++;
                    found++;
                    break;
                }
            }
        }
        result.length = password.length;
        result.other = result.length - found;
    } else {
        result.length = 0;
        result.other = 0;
    }

    return result;
}