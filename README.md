
Get an available TCP or UDP port for the given IP address.


## Usage

```js
const freePort = require('free-port');

freePort()
	.then(port =>
	{
		console.log(port);
		//=> 34323
	});
```

Optionally, provide the TCP/IP protocol family type, IP address and/or port:

```js
freePort({ type: 'tcp', ip: '10.10.10.1', port: 8000 })
	.then(port =>
	{
		console.log(port);
		//=> 8000 if the given port if free to use, otherwise the corresponding exception is thrown
	});
```


## API

### freePort([options])

Returns a `Promise` for a port number.

#### options

Type: `Object`

##### type

Type: `string`

TCP/IP family type. Options for this parameter are 'udp' and 'tcp'. Default value is 'udp'.

##### port

Type: `number`

Specific port to be checked. Default value is 0, which means that any free port can be taken.

##### ip

Type: `string`

The IP address for which a free port is requested. IPv4 and IPv6 addressing is supported.
Default value is '127.0.0.1'.
