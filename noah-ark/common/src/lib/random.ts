export function randomString(length: number, useSpecialChars = false) {
    let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    possible = useSpecialChars ? possible + '!@$%^&*()_+-.' : possible;
    let text = "";
    for (let i = 0; i < length; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

export function randomDigit(): number {
    return Math.round(Math.random() * 9);
}


export function minmax(n: number, min: number, max: number) {
    min = Math.min(min, max)
    max = Math.max(min, max)
    return Math.min(max, Math.max(n, min))
}

//l=00 -> 1
//l=-80 -> 1
export function randomDigits(length = 1): number {
    return +new Array(minmax(length, 1, 18)).fill(0).map(() => Math.round(Math.random() * 9)).join('')
}