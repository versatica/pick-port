const net = require('net');

module.exports = async function({ ip, port })
{
	const server = net.createServer();

	return new Promise((resolve, reject) =>
	{
		server.unref();
		server.on('error', reject);

		server.listen(port, ip, () => server.close(resolve));
	});
};
