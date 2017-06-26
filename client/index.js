const TcpClient = require('tcp-framework').Client;
const assert = require('assert');

module.exports = class extends TcpClient {
    constructor({host, port, timeout}) {
        super({host, port, timeout});
    }

    async register(request) {
    	assert(typeof request.name === 'string', 'name needs to be a string');
    	assert(typeof request.host === 'string', 'host needs to be a string');
    	assert(Number.isInteger(request.port), 'port needs to be an integer');
    	assert(Number.isInteger(request.timeout), 'timeout needs to be an integer');

		return this.send('register', request);
    }

    async lookup(name) {
    	assert(typeof name === 'string', 'name needs to be a string');
		return this.send('lookup', name);
    }

	async send(command, outgoingPayload) {
		const outgoingMessage = Buffer.from(JSON.stringify({command, payload:outgoingPayload}), 'utf8');
		const incomingMessage = JSON.parse((await super.send(outgoingMessage)).toString('utf8'));
		assert(incomingMessage.status === 0, 'internal server error');
		return incomingMessage.payload;
    }
};