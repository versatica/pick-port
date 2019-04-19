const dgram = require('dgram');

module.exports = async function({ ip, port, family })
{
	const server = dgram.createSocket(family === 4 ? 'udp4' : 'udp6');

	return new Promise((resolve, reject) =>
	{
		server.unref();
		server.on('error', reject);

		server.bind(port, ip, () => server.close(resolve));
	});
};
