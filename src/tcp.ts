import * as net from 'node:net';

export async function reserve(
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	{ ip, port, family }: { ip: string; port: number; family: 4 | 6 },
): Promise<void> {
	const server = net.createServer();

	await new Promise<void>((resolve, reject) => {
		server.unref();
		server.on('error', reject);

		server.listen({ port, host: ip, exclusive: true }, () =>
			server.close(() => resolve()),
		);
	});
}
