'use strict';

const net = require('net');
const tcp = require('./lib/tcp');
const udp = require('./lib/udp');

// Store picked ports for the specified 'reserveTimeout' time.
const reserved =
{
	'udp' : new Set(),
	'tcp' : new Set()
};

const defaultOptions =
{
	type           : 'udp',
	ip             : '127.0.0.1',
	port           : 0,
	range          : {},
	reserveTimeout : 5
};

const reserve = function(type, port, timeout)
{
	reserved[type].add(port);

	setTimeout(() => reserved[type].delete(port), timeout * 1000);
};

const getPort = (options) => new Promise((resolve, reject) =>
{
	const handler = options.type === 'udp'? udp : tcp;

	// Specific port specified or no range indicated.
	if (options.port !== 0 || !options.range)
	{
		handler(options)
			.then((port) =>
			{
				reserve(options.type, port, options.reserveTimeout);

				resolve(port);
			})
			.catch((error) =>
			{
				reject(error);
			});

		return;
	}

	// Range specified. Get a free port on the given range.
	else
	{
		const range = options.range;

		delete options.range;

		let retries = 0;

		// Take a random port in the range.
		options.port = Math.floor(
			Math.random() * ((range.max + 1) - range.min)) + range.min;

		const pickPort = () =>
		{
			options.port++;

			// Keep the port within the range.
			if (options.port > range.max)
				options.port = range.min;

			// Try picking a free port for as many times as the number of
			// ports within the range.
			if (retries++ > (range.max - range.min))
				return reject(new Error('All ports in the given range are in use'));

			// The port is reserved, try with another one.
			if (reserved[options.type].has(options.port))
				return pickPort();

			// The port is not reserved try to bind it.
			handler(options)
				.then((port) =>
				{
					// Free. reserve it.
					reserve(options.type, port, options.reserveTimeout);

					resolve(port);
				})
				.catch((error) =>
				{
					// In use, try with another one.
					if (error.code === 'EADDRINUSE')
						pickPort();
					else
						reject(error);
				});
		};

		pickPort();
	}
});

module.exports = (options = {}) =>
{
	options = Object.assign({}, defaultOptions, options);

	// Sanity checks.
	const type = options.type.toLowerCase();

	if (type !== 'udp' && type !== 'tcp')
		return Promise.reject(new Error('Invalid parameter: "type"'));

	const family = net.isIP(options.ip);

	if (family !== 4 && family !== 6)
		return Promise.reject(new Error('Invalid parameter: "ip"'));

	if (typeof options.port !== 'number')
		return Promise.reject(new Error('Invalid parameter: "port"'));

	if (typeof options.reserveTimeout !== 'number')
		return Promise.reject(new Error('Invalid parameter: "reserveTimeout"'));

	const range = options.range;

	// Both range edges defined.
	if (range.hasOwnProperty('min') && range.hasOwnProperty('max'))
	{
		if (typeof range.min !== 'number' || typeof range.max !== 'number')
			return Promise.reject(new Error('Invalid parameter: "range"'));

		if (range.min > range.max)
			return Promise.reject(new Error('Invalid parameter: "range"'));
	}
	// Single range edge defined.
	else if (range.hasOwnProperty('min') || range.hasOwnProperty('max'))
	{
		return Promise.reject(new Error('Invalid parameter: "range"'));
	}
	// No range defined.
	else
	{
		delete options.range;
	}

	options.type = type;
	options.family = family;

	// Get the port.
	return getPort(options);
};
