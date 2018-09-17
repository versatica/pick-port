
Get an available TCP or UDP port for the given IP address.


## Usage

```js
const pickPort = require('pick-port');

pickPort()
	.then(port =>
	{
		console.log(port);
	});
```

Optionally, provide the TCP/IP protocol family type, IP address and/or port:

```js
pickPort({ type: 'tcp', ip: '10.10.10.1', port: 8000 })
	.then(port =>
	{
		console.log(port);
	})
	.catch((error) =>
	{
		console.log(error);
	});
```


## API

### pickPort([options])

Returns a `Promise`.

Resolves with the free port number on success or throws if error or no free ports in the given range are available.

#### options

Type: `Object`

##### options.type

TCP/IP family type. Possible values for this parameter are 'udp' and 'tcp'.

* Type: `String`.
* Default value: 'udp'.

##### options.port

Specific port to be checked or 0 to specify that any free port can be taken.

* Type: `Number`.
* Default value: 0.

##### options.range

The port range for which a free port is requested. If specified, only ports in the given range are considered.

* Type: `Object`.
* Default value: undefined.

###### options.range.min

The minimum port number in the range.

* Type: `Number`

###### options.range.max

The maximum port number in the range.

* Type: `Number`.

##### options.ip

The IP address for which a free port is requested. IPv4 and IPv6 addressing is supported.

* Type: `String`.
* Default value: '127.0.0.1'.

##### options.reserveTimeout

Timeout in seconds, during which a returned free port will be internally reserved and prevented of being returned on a future call before the timeout has elapsed.

This provides the application using this library with the required time to bind the free port before it is given again on a future call.

* Type: `Number`.
* Default value: 5.
