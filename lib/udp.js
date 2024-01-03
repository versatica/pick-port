"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reserve = void 0;
const dgram = require("node:dgram");
async function reserve({ ip, port, family }) {
    const server = dgram.createSocket(family === 4 ? 'udp4' : 'udp6');
    await new Promise((resolve, reject) => {
        server.unref();
        server.on('error', reject);
        server.bind({ port, address: ip, exclusive: true }, () => server.close(() => resolve()));
    });
}
exports.reserve = reserve;
