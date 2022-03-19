const redis = require('redis');

const config = {
    host    : process.env.REDIS_HOST || 'localhost',
    port    : parseInt(process.env.REDIS_PORT || 6379),
    password: process.env.REDIS_PASS || '',
    db      : parseInt(process.env.REDIS_DB || 0),
};

const obj = {
    /**
     * @type {redis.RedisClientType}
     */
    client: null,
};

function init () {
    return new Promise((resolve, reject) => {
        const client = redis.createClient({
            url     : `redis://${config.host}:${config.port}`,
            password: config.password,
            database: config.db
        });
        client.on('ready', () => {
            obj.client = client;
            resolve();
        });
        client.on('error', reject);
        client.connect().then();
    });
}

module.exports = {
    init,
    get client () {
        return obj.client;
    }
};
