const mongodb = require('mongodb');

const config = {
    host: process.env.MONGO_HOST || 'localhost',
    port: parseInt(process.env.MONGO_PORT || 27017),
    db  : process.env.MONGO_DB || 'test',
    user: process.env.MONGO_USER || '',
    pass: process.env.MONGO_PASS || ''
};

const obj = {
    /**
     * @type {mongodb.Db}
     */
    db    : null,
    /**
     * @type {mongodb.MongoClient}
     */
    client: null,
};

async function init () {
    const userinfo = config.user ? `${config.user}:${config.pass}@` : '';
    const url = `mongodb://${userinfo}${config.host}:${config.port}`;
    obj.client = await mongodb.MongoClient.connect(url, {
        maxPoolSize: 10,
        minPoolSize: 5,
    });
    obj.db = obj.client.db(config.db);
}

module.exports = {
    init,
    get db () {
        return obj.db;
    }
};
