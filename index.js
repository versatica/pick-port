const net = require('net');
const debug = require('debug')('pick-port');
const warn = require('debug')('pick-port:WARN');
const tcp = require('./lib/tcp');
const udp = require('./lib/udp');

/* eslint-disable no-console */
debug.log = console.debug.bind(console);
warn.log = console.warn.bind(console);
/* eslint-enable no-console */

// Store picked ports for the specified reserveTimeout time.
// This Set stores strings with the form "type:ip:port".
const reserved = new Set();

module.exports = async function(
	{
		type = 'udp',
		ip = '0.0.0.0',
		minPort = 10000,
		maxPort = 20000,
		reserveTimeout = 5
	} = {}
)
{
	debug(
		'called with [type:%s, ip:%s, minPort:%d, maxPort:%d, reserveTimeout:%d]',
		type, ip, minPort, maxPort, reserveTimeout);

	// Sanity checks.
	type = type.toLowerCase();

	const family = net.isIP(ip);

	if (type !== 'udp' && type !== 'tcp')
		throw new TypeError('invalid type parameter');

	if (family !== 4 && family !== 6)
		throw new TypeError('invalid ip parameter');

	if (typeof minPort !== 'number' || typeof maxPort !== 'number' || minPort > maxPort)
		throw new TypeError('invalid minPort/maxPort parameter');

	if (typeof reserveTimeout !== 'number')
		throw new TypeError('invalid reserveTimeout parameter');

	const handle = type === 'udp'? udp : tcp;

	// Take a random port in the range.
	let port = Math.floor(Math.random() * ((maxPort + 1) - minPort)) + minPort;
	let retries = maxPort - minPort + 1;

	while (--retries >= 0)
	{
		// Keep the port within the range.
		if (++port > maxPort)
			port = minPort;

		// If current port is reserved, try next one.
		if (isReserved({ type, ip, port }))
			continue;

		try
		{
			await handle({ ip, port, family });

			reserve({ type, ip, port, reserveTimeout });

			debug('got an available port [type:%s, ip:%s, port:%d]', type, ip, port);

			return port;
		}
		catch (error)
		{
			if (error.code === 'EADDRINUSE')
			{
				debug('port in use [type:%s, ip:%s, port:%d]', type, ip, port);

				continue;
			}
			else
			{
				warn(
					'could not get any available port [type:%s, ip:%s, port:%d]: %s',
					type, ip, port, error.toString());

				throw error;
			}
		}
	}

	throw new Error('no port available');
};

function reserve({ type, ip, port, reserveTimeout })
{
	const value = `${type}:${ip}:${port}`;

	reserved.add(value);

	setTimeout(() => reserved.delete(value), reserveTimeout * 1000);
}

function isReserved({ type, ip, port })
{
	const value = `${type}:${ip}:${port}`;

	return reserved.has(value);
}
