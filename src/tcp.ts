import * as net from 'node:net';

export async function reserve(ip: string, port: number): Promise<void> {
	const server = net.createServer();

	await new Promise<void>((resolve, reject) => {
		server.unref();
		server.on('error', reject);

		server.listen({ host: ip, port, exclusive: true }, () => {
			server.close(() => resolve());
		});
	});
}
