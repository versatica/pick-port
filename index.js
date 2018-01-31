'use strict';

const net = require('net');
const dgram = require('dgram');

const defaultOptions =
{
	type : 'udp',
	ip   : '127.0.0.1',
	port : 0
};

const getTcpPort = (options) => new Promise((resolve, reject) =>
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

const getUdpPort = (options) => new Promise((resolve, reject) =>
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
		});
	});
});

module.exports = (options = {}) =>
{
	const _options = Object.assign({}, defaultOptions, options);

	// Sanity checks.
	const type = _options.type.toLowerCase();

	if (type !== 'udp' && type !== 'tcp')
		return Promise.reject(new Error('Invalid parameter: "type"'));

	const family = net.isIP(_options.ip);

	if (family !== 4 && family !== 6)
		return Promise.reject(new Error('Invalid parameter: "ip"'));

	if (typeof _options.port !== 'number')
		return Promise.reject(new Error('Invalid parameter: "port"'));

	_options.type = type;
	_options.family = family;

	// Get the port.
	if (_options.type === 'udp')
		return getUdpPort(_options);
	else
		return getTcpPort(_options);
};
