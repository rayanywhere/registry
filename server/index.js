const TcpServer = require('tcp-framework').Server;
const log4js = require('log4js');
const Database = require('./database');
const assert = require('assert');

module.exports = class extends TcpServer {
	constructor() {
        super(require('./options')());
		log4js.configure({
            appenders: [
                {
                    type: 'console'
                },
                {
                    type: 'dateFile',
                    filename: './logs/runtime/',
                    pattern: "yyyy-MM-dd.log",
                    alwaysIncludePattern: true
                }
            ]
        });
        global.logger = log4js.getLogger();
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

    async process(socket, incomingMessage) {
		const request = JSON.parse(incomingMessage.toString('utf8'));
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

                    this._database.add(request.payload.name, {
                        host: request.payload.host,
                        port: request.payload.port,
                        timeout: request.payload.timeout
                    });
                    break;
                case 'lookup':
                    assert(typeof request.payload === 'string', '[LOOKUP]bad request');
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
		return Buffer.from(JSON.stringify(response), 'utf8');
	}
}