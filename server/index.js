const TcpServer = require('tcp-framework').Server;
const Message = require('tcp-framework').Message;
const log4js = require('log4js');
const path = require('path');
const Database = require('./database');
const assert = require('assert');

module.exports = class extends TcpServer {
	constructor() {
        super(require('./options')());
        console.log(path.resolve(this._options.log) + '/runtime/');
		log4js.configure({
            appenders: [
                {
                    type: 'console',
                    category: 'runtime'
                },
                {
                    type: 'dateFile',
                    filename: path.resolve(this._options.log) + '/runtime/',
                    pattern: "yyyy-MM-dd.log",
                    alwaysIncludePattern: true,
                    category: 'runtime'
                }
            ]
        });
        global.logger = log4js.getLogger('runtime');
        this._database = new Database();
	}

    onStarted() {
		logger.info(`server started at ${this._options.host}:${this._options.port}`);
	}

	onStopped() {
		logger.info(`server stopped at ${this._options.host}:${this._options.port}`);
	}

	onConnected(socket) {
		logger.info(`client(${socket.remoteAddress}:${socket.remotePort}) connected`);
	}

	onClosed(socket) {
		logger.info(`client(${socket.remoteAddress}:${socket.remotePort}) closed`);
	}

	onError(socket, err) {
		logger.info(`error occurred at client(${socket.remoteAddress}:${socket.remotePort}): ${err.stack}`);
	}

    onMessage(socket, incomingMessage) {
			const request = JSON.parse(incomingMessage.payload.toString('utf8'));
			const response = {
				status: 0,
				payload: undefined
			};
        try {
            switch(request.command) {
                case 'register':
                    assert(typeof request.payload.name === 'string', '[REGISTER]bad name parameter');
                    assert(typeof request.payload.host === 'string', '[REGISTER]bad host parameter');
                    assert(Number.isInteger(request.payload.port), '[REGISTER]bad port parameter');
                    assert(Number.isInteger(request.payload.timeout), '[REGISTER]bad timeout parameter');

                    logger.debug(`registering ${request.payload.name} with params(${JSON.stringify(request.payload)})...`)
                    this._database.add(request.payload.name, {
                        host: request.payload.host,
                        port: request.payload.port,
                        timeout: request.payload.timeout
                    });
                    break;
                case 'lookup':
                    assert(typeof request.payload === 'string', '[LOOKUP]bad request');
                    logger.debug(`looking up ${request.payload}...`)
                    response.payload = this._database.query(request.payload);
                    if (response.payload === undefined) {
                        throw new Error(`no such record:${request.payload}`);
                    }
                    break;
                default:
                    throw new Error(`unknown command(${request.command})`);
            }
        }
        catch(err) {
            logger.error('business error: ' + err.stack);
            response.status = -1;
            response.payload = undefined;
        }
        this.send(socket, new Message(Message.SIGN_DATA, Buffer.from(JSON.stringify(response), 'utf8'), incomingMessage.uuid));
	}
}
