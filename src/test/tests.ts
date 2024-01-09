import * as os from 'node:os';
import * as net from 'node:net';
import * as matchers from 'jest-extended';
import { pickPort } from '../';
import { Logger } from '../Logger';

// Add all jest-extended matchers.
expect.extend(matchers);

const logger = new Logger('tests');

type TestContext = {
	bindableIps: string[];
	nonBindableIps: string[];
};

const ctx: TestContext = {
	bindableIps: [],
	nonBindableIps: ['8.8.8.8', 'fe80::1:12345'],
};

beforeAll(async () => {
	const setIps: Set<string> = new Set();

	for (const iface of Object.values(os.networkInterfaces())) {
		for (const { address } of iface ?? []) {
			if (setIps.has(address)) {
				continue;
			}

			setIps.add(address);

			if (await isBindableIp(address)) {
				ctx.bindableIps.push(address);
			}
		}
	}

	logger.debug('beforeAll() | ctx.bindableIps:', ctx.bindableIps);
});

test('pick UDP port in default IP 0.0.0.0 succeeds', async () => {
	await expect(
		pickPort({ type: 'udp', reserveTimeout: 0 }),
	).resolves.toBeNumber();
}, 2000);

test('pick TCP port in default IP 0.0.0.0 succeeds', async () => {
	await expect(
		pickPort({ type: 'tcp', reserveTimeout: 0 }),
	).resolves.toBeNumber();
}, 2000);

test('pick UDP port in bindable IPs succeeds', async () => {
	for (const ip of ctx.bindableIps) {
		await expect(
			pickPort({ type: 'udp', ip: ip, reserveTimeout: 0 }),
		).resolves.toBeNumber();
	}
}, 2000);

test('pick TCP port in bindable IPs succeeds', async () => {
	for (const ip of ctx.bindableIps) {
		await expect(
			pickPort({ type: 'tcp', ip: ip, reserveTimeout: 0 }),
		).resolves.toBeNumber();
	}
}, 2000);

test('pick UDP port in non bindable IPs fails', async () => {
	for (const ip of ctx.nonBindableIps) {
		await expect(
			pickPort({ type: 'udp', ip: ip, reserveTimeout: 0 }),
		).rejects.toThrow();
	}
}, 2000);

test('pick TCP port in non bindable IPs fails', async () => {
	for (const ip of ctx.nonBindableIps) {
		await expect(
			pickPort({ type: 'tcp', ip: ip, reserveTimeout: 0 }),
		).rejects.toThrow();
	}
}, 2000);

/**
 * Not all reported IPs are bindable. Verify it by binding on them in a random
 * TCP port.
 */
async function isBindableIp(ip: string): Promise<boolean> {
	const server = net.createServer();

	try {
		await new Promise<void>((resolve, reject) => {
			server.unref();
			server.on('error', reject);

			server.listen({ host: ip, port: 0, exclusive: true }, () =>
				server.close(() => resolve()),
			);
		});

		return true;
	} catch (error) {
		logger.debug(
			`isBindableIp() | discarding not bindable IP '${ip}': ${error}`,
		);

		return false;
	}
}
