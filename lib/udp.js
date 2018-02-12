'use strict';

const dgram = require('dgram');

const getPort = (options) => new Promise((resolve, reject) =>
{
	const server = dgram.createSocket(options.family === 4 ? 'udp4' : 'udp6');

	server.unref();
	server.on('error', reject);

	server.bind(options.port, options.ip, () =>
	{
		const port = server.address().port;

		server.close(() =>
		{
			resolve(port);

			return;
		});
	});
});

module.exports = (options = {}) =>
{
	return getPort(options);
};
