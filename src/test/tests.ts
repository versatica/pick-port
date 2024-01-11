import * as os from 'node:os';
import * as net from 'node:net';
import * as matchers from 'jest-extended';
import { pickPort, Type } from '../';
import { Logger } from '../Logger';

// Add all jest-extended matchers.
expect.extend(matchers);

const logger = new Logger('tests');
const allTypes: Type[] = ['tcp', 'udp'];

type TestContext = {
	bindableIps: string[];
	nonBindableIps: string[];
};

const ctx: TestContext = {
	bindableIps: [],
	nonBindableIps: ['8.8.8.8', 'fe80::1:12345', 'WRONG IP'],
};

beforeAll(async () => {
	const ips: Set<string> = new Set();

	for (const iface of Object.values(os.networkInterfaces())) {
		for (const { address } of iface ?? []) {
			if (ips.has(address)) {
				continue;
			}

			ips.add(address);

			if (await isBindableIp(address)) {
				ctx.bindableIps.push(address);
			}
		}
	}

	logger.debug('beforeAll() | ctx.bindableIps:', ctx.bindableIps);
});

test('pick port in default IP 0.0.0.0 succeeds', async () => {
	for (const type of allTypes) {
		await expect(pickPort({ type, reserveTimeout: 0 })).resolves.toBeNumber();
	}
}, 2000);

test('pick port in bindable IPs succeeds', async () => {
	for (const type of allTypes) {
		for (const ip of ctx.bindableIps) {
			await expect(
				pickPort({ type, ip, reserveTimeout: 0 }),
			).resolves.toBeNumber();
		}
	}
}, 2000);

test('pick port in non bindable IPs fails', async () => {
	for (const type of allTypes) {
		for (const ip of ctx.nonBindableIps) {
			await expect(pickPort({ type, ip, reserveTimeout: 0 })).rejects.toThrow();
		}
	}
}, 2000);

test('pick port with minPort and maxPort IPs succeeds', async () => {
	const ip = '127.0.0.1';
	const minPort = 2001;
	const maxPort = 2002;
	const reserveTimeout = 2;

	for (const type of allTypes) {
		const port1 = await pickPort({
			type,
			ip,
			minPort,
			maxPort,
			reserveTimeout,
		});

		const port2 = await pickPort({
			type,
			ip,
			minPort,
			maxPort,
			reserveTimeout,
		});

		expect([port1, port2]).toEqual(expect.arrayContaining([minPort, maxPort]));

		// No more ports available during reserve time second so this should
		// reject.
		await expect(
			pickPort({ type, ip, minPort, maxPort, reserveTimeout }),
		).rejects.toThrow();

		// However it should work if a separate range is given.
		await expect(
			pickPort({ type, ip, minPort: 3001, maxPort: 3002, reserveTimeout }),
		).resolves.toBeNumber();

		// After reserve time, ports should be available again.
		await new Promise<void>(resolve =>
			setTimeout(resolve, reserveTimeout * 1000),
		);

		await expect(
			pickPort({ type, ip, minPort, maxPort, reserveTimeout }),
		).resolves.toBeNumber();
	}
}, 6000);

test('pick 2 ports at the same time succeeds', async () => {
	for (const type of allTypes) {
		const ip = '127.0.0.1';
		const minPort = 3001;
		const maxPort = 3002;
		const reserveTimeout = 2;

		await expect(
			Promise.all([
				pickPort({
					type,
					ip,
					minPort,
					maxPort,
					reserveTimeout,
				}),
				pickPort({
					type,
					ip,
					minPort,
					maxPort,
					reserveTimeout,
				}),
			]),
		).resolves.toEqual([expect.toBeNumber(), expect.toBeNumber()]);
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
