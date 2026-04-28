export type RedisConnectionString = {
    username?: string;
    password?: string;
    host: string;
    port: number;
    db?: string;
};
export function parseRedisConfig(variableName: string): RedisConnectionString[] {
    const config = process.env[variableName];
    return config ? extractRedisConnectionString(config) : [];
}

export function extractRedisConnectionString(str: string) {
    //All REDIS clients in env variables SHOULD be HOST:PORT format.

    str = (str ?? "").trim();
    const hostsAndPorts = str.split(",").map((h) => h.trim());
    return hostsAndPorts
        .map((h) => {
            return parseRedisConnectionString(h);
        })
        .filter((h) => h.host && h.port);
}

function parseRedisConnectionString(connectionString: string): RedisConnectionString {
    const regex = /^(?:([^:]+):([^@]+)@)?([^:\/]+):(\d+)(?:\/(\d+))?$/;
    const match = connectionString.match(regex);

    if (!match) {
        throw new Error("Invalid Redis connection string format");
    }

    const [, user, password, host, port, db] = match;
    return {
        username: user || "", // Default to empty string if missing
        password: password || "",
        host: host,
        port: Number(port),
        db: db || "0", // Default DB to "0" if missing
    } as RedisConnectionString;
}
