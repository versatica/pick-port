'use strict';

const net = require('net');

const getPort = (options) => new Promise((resolve, reject) =>
{
	const server = net.createServer();

	server.unref();
	server.on('error', reject);

	server.listen(options.port, options.ip, () =>
	{
		const port = server.address().port;

		server.close(() =>
		{
			resolve(port);
		});
	});
});

module.exports = (options = {}) =>
{
	return getPort(options);
};
