const Client = require('../client');
const assert = require('assert');

describe('#register-service', function() {
    before(function() {
        global.client = new Client({host:'localhost', port:2011});
    });

    describe("testing normal register / lookup flow", function() {
        it("should return without error", async function() {
            await client.register({
                name: 'Test.Service', 
                host: 'localhost', 
                port: 8231,
                timeout: 10
            });

            let config = await client.lookup('Test.Service');
            assert(config.host === 'localhost' && config.port === 8231 && config.timeout === 10, 'config mismatch');
        });
    });

    describe("testing missing lookup", function() {
        it("should return with error", async function() {
            try {
                await client.lookup('Test.Service.NotExists');
            }
            catch(err) {
                return;
            }
            assert(false, 'should throw error');
        });
    });
});