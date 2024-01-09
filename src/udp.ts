import * as dgram from 'node:dgram';

export async function reserve(
	ip: string,
	port: number,
	family: 4 | 6,
): Promise<void> {
	const server = dgram.createSocket(family === 4 ? 'udp4' : 'udp6');

	await new Promise<void>((resolve, reject) => {
		server.unref();
		server.on('error', reject);

		server.bind({ address: ip, port, exclusive: true }, () => {
			server.close(() => resolve());
		});
	});
}
