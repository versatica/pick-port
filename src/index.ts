import * as net from 'node:net';
import * as crypto from 'node:crypto';
import { Logger } from './Logger';
import { reserve as reserveTcp } from './tcp';
import { reserve as reserveUdp } from './udp';

const logger = new Logger();

export type Type = 'tcp' | 'udp';

// Store picked ports for the specified reserveTimeout time.
// This Set stores strings/hashes with the form "type:ip:port".
const reserved: Set<string> = new Set();

// Last reserved port (used to optimize the random port lookup).
let lastReservedPort: number | undefined = undefined;

export async function pickPort({
	type,
	ip = '0.0.0.0',
	minPort = 10000,
	maxPort = 20000,
	reserveTimeout = 5,
}: {
	type: Type;
	ip?: string;
	minPort?: number;
	maxPort?: number;
	reserveTimeout?: number;
}): Promise<number> {
	logger.debug(
		`pickPort() [type:${type}, ip:${ip}, minPort:${minPort}, maxPort:${maxPort}, reserveTimeout:${reserveTimeout}]`,
	);

	// Sanity checks.

	type = type.toLowerCase() as Type;

	const family = net.isIP(ip);

	if (type !== 'udp' && type !== 'tcp') {
		throw new TypeError('invalid type parameter');
	} else if (family !== 4 && family !== 6) {
		throw new TypeError('invalid ip parameter');
	} else if (
		typeof minPort !== 'number' ||
		typeof maxPort !== 'number' ||
		minPort > maxPort
	) {
		throw new TypeError('invalid minPort/maxPort parameter');
	} else if (typeof reserveTimeout !== 'number') {
		throw new TypeError('invalid reserveTimeout parameter');
	}

	// If last reserved port is not in the given min/max port range, unset it.
	if (
		lastReservedPort !== undefined &&
		(lastReservedPort < minPort || lastReservedPort > maxPort)
	) {
		lastReservedPort = undefined;
	}

	// Take a random port in the range.
	// NOTE: Use last reserved port (if any) as initial value since it will be
	// incremented at the end of the loop below.
	let port = lastReservedPort ?? crypto.randomInt(minPort, maxPort + 1);

	let retries = maxPort - minPort + 1;

	while (--retries >= 0) {
		// Keep the port within the range.
		if (++port > maxPort) {
			port = minPort;
		}

		const hash = generateHash(type, ip, port);

		// If current port is reserved, try next one.
		if (isReserved(hash)) {
			continue;
		}

		// Optimistically reserve the port.
		reserve(hash);

		try {
			switch (type) {
				case 'tcp': {
					await reserveTcp(ip, port);

					break;
				}

				case 'udp': {
					await reserveUdp(ip, port, family);

					break;
				}
			}

			logger.debug(
				`pickPort() | got available port [type:${type}, ip:${ip}, port:${port}]`,
			);

			lastReservedPort = port;

			// Unreserve the reserved port after given timeout.
			setTimeout(() => unreserve(hash), reserveTimeout * 1000);

			return port;
		} catch (error) {
			unreserve(hash);

			if ((error as NodeJS.ErrnoException).code === 'EADDRINUSE') {
				logger.debug(
					`pickPort() | port in use [type:${type}, ip:${ip}, port:${port}]`,
				);

				continue;
			} else {
				logger.warn(
					`pickPort() | unexpected error trying to bind a port [type:${type}, ip:${ip}, port:${port}]: ${error}`,
				);

				throw error;
			}
		}
	}

	logger.warn(
		`pickPort() | no available port in the given port range [type:${type}, ip:${ip}]`,
	);

	throw new Error('no available port in the given port range');
}

function generateHash(type: Type, ip: string, port: number): string {
	return `${type}:${ip}:${port}`;
}

function reserve(hash: string): void {
	if (isReserved(hash)) {
		throw new Error(`reserve() | hash '${hash}' is already reserved`);
	}

	reserved.add(hash);
}

function unreserve(hash: string): void {
	if (!isReserved(hash)) {
		throw new Error(`unreserve() | hash '${hash}' is not reserved`);
	}

	reserved.delete(hash);
}

function isReserved(hash: string): boolean {
	return reserved.has(hash);
}
