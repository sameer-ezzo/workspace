export function extractRedisHostsAndPorts(str: string) {
    //All REDIS clients in env variables SHOULD be HOST:PORT format.

    str = (str ?? "").trim()
    const hostsAndPorts = str.split(',').map(h => h.trim())
    return hostsAndPorts.map(h => {
        const [host, port] = h.split(':')
        return { host, port: Number(port) }
    }).filter(h => h.host && h.port)
}