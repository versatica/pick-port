"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reserve = void 0;
const net = require("node:net");
async function reserve(
// eslint-disable-next-line @typescript-eslint/no-unused-vars
{ ip, port, family }) {
    const server = net.createServer();
    await new Promise((resolve, reject) => {
        server.unref();
        server.on('error', reject);
        server.listen({ port, host: ip, exclusive: true }, () => server.close(() => resolve()));
    });
}
exports.reserve = reserve;
