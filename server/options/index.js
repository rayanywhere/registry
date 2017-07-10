const opts = require('opts');

module.exports = () => {
	const opt = [
        {
            short: 'h',
            long: 'host',
            description: 'host to listen',
            value: true,
            required: false
        },
        {
            short: 'p',
            long: 'port',
            description: 'port to listen',
            value: true,
            required: false
        },
        {
            short: 't',
            long: 'timeout',
            description: 'maximum idle time of a connect client',
            value: true,
            required: false
        },
        {
            short: 'd',
            long: 'duration',
            description: 'second(s) of serving time, shutdown service afterward',
            value: true,
            required: false
        },
        {
            short: 'l',
            long: 'log',
            description: 'log directory',
            value: true,
            required: false
        }
    ];
    opts.parse(opt, [], true);

    return {
        host: (typeof opts.get('host') === 'undefined') ? 'localhost' : opts.get('host'),
        port: (typeof opts.get('port') === 'undefined') ? 10000 : parseInt(opts.get('port')),
        timeout: (typeof opts.get('timeout') === 'undefined') ? 3 : parseInt(opts.get('timeout')),
        duration: (typeof opts.get('duration') === 'undefined') ? undefined : parseInt(opts.get('duration')),
        log: (opts.get('log') === undefined) ? './logs/' : opts.get('log')
    };
};