# pick-port

Get an available TCP or UDP port for the given IP address.

```bash
$ npm install pick-port
```


## Usage

```js
import { pickPort } from 'pick-port';
```

Get a random UDP port in IP 0.0.0.0:

```js
const port = await pickPort();
```

Get a TCP port in a specific IP and port range:

```js
const port = await pickPort(
	{ type: 'tcp', ip: '192.168.10.111', minPort: 8000, maxPort: 9000 }
);
```


## API

### async pickPort({ type, ip, minPort, maxPort, reserveTimeout }): Promise<number>

Resolves with an available port or rejects with an error otherwise.

| Option        | Type   | Description   | Required | Default |
| ------------- | ------ | ------------- |   :---:  | ------- |
| `type`        | String | 'udp' or 'tcp'. | No      | 'udp'   |
| `ip`          | String | IPv4 or IPv6 address for which a free port is requested. | No      | '0.0.0.0' |
| `minPort`     | Number | Minimum port.   | No      | 10000   |
| `maxPort`     | Number | Maximum port.   | No      | 20000   |
| `reserveTimeout` | Number | Timeout in seconds during which a returned port will be internally reserved and prevented of being returned on a future call before the timeout has elapsed. | No | 5 |

* `@returns` {Number} A free port.

The `reserveTimeout` option provides the application with the required time to bind the free port before it is given again on a future call to this library.


## Author

* José Luis Millán [[github](https://github.com/jmillan/)]


## License

[ISC](./LICENSE)
