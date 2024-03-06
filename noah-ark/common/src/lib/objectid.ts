export class ObjectId {
    static generate(): string {
        let result = Math.round(new Date().getTime() / 1000).toString(16);
        for (let i = 0; i < 16; i++) {
            result += Math.round(Math.random() * 16).toString(16);
        }
        return result.substring(0, 24);
    }
}