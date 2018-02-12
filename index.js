'use strict';

const net = require('net');
const tcp = require('./lib/tcp');
const udp = require('./lib/udp');

const defaultOptions =
{
	type  : 'udp',
	ip    : '127.0.0.1',
	port  : 0,
	range : {}
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
				resolve(port);

				return;

			})
			.catch((error) =>
			{
				reject(error);

				return;

			});
	}

	// Range specified. Get a free port on the given range.
	else
	{
		const range = options.range;

		delete options.range;

		let retries = 0;

		options.port = range.min;

		const pickPort = () =>
		{
			handler(options)
				.then((port) =>
				{
					resolve(port);

					return;

				})
				.catch((error) =>
				{
					if (error.code === 'EADDRINUSE')
					{
						if (++retries <= range.max - range.min)
						{
							options.port++;
							pickPort();
						}
						else
						{
							reject(new Error('All ports in the given range are in use'));

							return;
						}
					}

					else
					{
						reject(error);

						return;
					}
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
