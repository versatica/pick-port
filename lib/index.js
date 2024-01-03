"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pickPort = void 0;
const net = require("node:net");
const Logger_1 = require("./Logger");
const tcp_1 = require("./tcp");
const udp_1 = require("./udp");
const logger = new Logger_1.Logger();
// Store picked ports for the specified reserveTimeout time.
// This Set stores strings/hashes with the form "type:ip:port".
const reserved = new Set();
async function pickPort({ type = 'udp', ip = '0.0.0.0', minPort = 10000, maxPort = 20000, reserveTimeout = 5 } = {}) {
    logger.debug(`pickPort() [type:${type}, ip:${ip}, minPort:${minPort}, maxPort:${maxPort}, reserveTimeout:${reserveTimeout}]`);
    // Sanity checks.
    type = type.toLowerCase();
    const family = net.isIP(ip);
    if (type !== 'udp' && type !== 'tcp') {
        throw new TypeError('invalid type parameter');
    }
    else if (family !== 4 && family !== 6) {
        throw new TypeError('invalid ip parameter');
    }
    else if (typeof minPort !== 'number' || typeof maxPort !== 'number' || minPort > maxPort) {
        throw new TypeError('invalid minPort/maxPort parameter');
    }
    else if (typeof reserveTimeout !== 'number') {
        throw new TypeError('invalid reserveTimeout parameter');
    }
    const handle = type === 'udp' ? udp_1.reserve : tcp_1.reserve;
    // Take a random port in the range.
    let port = Math.floor(Math.random() * ((maxPort + 1) - minPort)) + minPort;
    let retries = maxPort - minPort + 1;
    while (--retries >= 0) {
        // Keep the port within the range.
        if (++port > maxPort) {
            port = minPort;
        }
        // If current port is reserved, try next one.
        if (isReserved({ type, ip, port })) {
            continue;
        }
        try {
            await handle({ ip, port, family });
            reserve({ type, ip, port, reserveTimeout });
            logger.debug(`pickPort() got an available port [type:${type}, ip:${ip}, port:${port}]`);
            return port;
        }
        catch (error) {
            if (error.code === 'EADDRINUSE') {
                logger.debug(`pickPort() | port in use [type:${type}, ip:${ip}, port:${port}]`);
                continue;
            }
            else {
                logger.warn(`pickPort() | could not get any available port [type:${type}, ip:${ip}, port:${port}]: ${error}`);
                throw error;
            }
        }
    }
    throw new Error('no port available');
}
exports.pickPort = pickPort;
function reserve({ type, ip, port, reserveTimeout }) {
    const hash = `${type}:${ip}:${port}`;
    reserved.add(hash);
    setTimeout(() => reserved.delete(hash), reserveTimeout * 1000);
}
function isReserved({ type, ip, port }) {
    const hash = `${type}:${ip}:${port}`;
    return reserved.has(hash);
}
