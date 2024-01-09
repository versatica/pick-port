import * as net from 'node:net';
import { Logger } from './Logger';
import { reserve as reserveTcp } from './tcp';
import { reserve as reserveUdp } from './udp';

const logger = new Logger();

export type Type = 'udp' | 'tcp';

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
	// NOTE: Use last reserved port as initial value since it will be incremented
	// at the end of the loop below.
	let port =
		lastReservedPort === undefined
			? Math.floor(Math.random() * (maxPort + 1 - minPort)) + minPort
			: lastReservedPort;

	let retries = maxPort - minPort + 1;

	while (--retries >= 0) {
		// Keep the port within the range.
		if (++port > maxPort) {
			port = minPort;
		}

		// If current port is reserved, try next one.
		if (isReserved(type, ip, port)) {
			continue;
		}

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

			reserve(type, ip, port, reserveTimeout);

			lastReservedPort = port;

			logger.debug(
				`pickPort() | got available port [type:${type}, ip:${ip}, port:${port}]`,
			);

			return port;
		} catch (error) {
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

function reserve(
	type: Type,
	ip: string,
	port: number,
	reserveTimeout: number,
): void {
	const hash = generateHash(type, ip, port);

	reserved.add(hash);
	setTimeout(() => reserved.delete(hash), reserveTimeout * 1000);
}

function isReserved(type: Type, ip: string, port: number): boolean {
	const hash = generateHash(type, ip, port);

	return reserved.has(hash);
}

function generateHash(type: Type, ip: string, port: number): string {
	return `${type}:${ip}:${port}`;
}
