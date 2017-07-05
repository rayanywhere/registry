const TcpClient = require('tcp-framework').Client;
const Message = require('tcp-framework').Message;
const assert = require('assert');

module.exports = class extends TcpClient {
    constructor({host, port, timeout}) {
        super({host, port, timeout});
		this._pendingCallbacks = new Map();
    }

    onMessage(incomingMessage) {
        const callback = this._pendingCallbacks.get(incomingMessage.uuid);
        if (callback !== undefined) {
            callback.success(incomingMessage);
        }
    }

    async register(request) {
    	assert(typeof request.name === 'string', 'name needs to be a string');
    	assert(typeof request.host === 'string', 'host needs to be a string');
    	assert(Number.isInteger(request.port), 'port needs to be an integer');
    	assert(Number.isInteger(request.timeout), 'timeout needs to be an integer');

		return this.request('register', request);
    }

    async lookup(name) {
    	assert(typeof name === 'string', 'name needs to be a string');
		return this.request('lookup', name);
    }

	_request(outgoingMessage) {
        return new Promise((resolve, reject) => {
            this._pendingCallbacks.set(outgoingMessage.uuid, {
                success: response => { this._pendingCallbacks.delete(outgoingMessage.uuid); resolve(response); },
                failure: error => { this._pendingCallbacks.delete(outgoingMessage.uuid); reject(error); }
            });
            this.send(outgoingMessage);
            setTimeout(() => {
                let callback = this._pendingCallbacks.get(outgoingMessage.uuid);
                if (callback !== undefined) {
                    callback.failure(new Error('request timeout'));
                }
            }, 1000 * this._options.timeout);
        });
    }

	async request(command, outgoingPayload) {
		try {
            const outgoingMessage = new Message(Message.SIGN_DATA, Buffer.from(JSON.stringify({command, payload:outgoingPayload}), 'utf8'));
            const incomingMessage = await this._request(outgoingMessage);
            const response = JSON.parse(incomingMessage.payload.toString('utf8'));
            assert(response.status === 0, 'internal server error');
            return response.payload;
        }
        catch(err) {
            throw new Error(`[registry/${command}]${err.stack}`);
        }
	}
};
