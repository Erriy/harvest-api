const express = require('express');
require('express-async-errors');
const assert = require('assert');
const cookie_parser = require('cookie-parser');
const logger = require('./logger');
const router = require('./router');
const redis = require('./redis');
const mongo = require('./mongo');

async function start (port) {
    await mongo.init();
    await redis.init();

    const app = express();

    app.use(express.json({limit: '5mb'}));
    app.use(cookie_parser());

    app.get('/healthy', (req, res)=>{
        res.status(200).end();
    });
    app.use(await router.router());

    app.use((err, req, res, next)=>{
        if(err instanceof assert.AssertionError) {
            return res.status(400).json({
                code   : 400,
                message: err.message,
            });
        }
        logger.error(err);
        res.status(500).json({
            code   : 500,
            message: 'internal server error',
        });
    });

    app.listen(parseInt(port));
}

if (module === require.main) {
    start(process.env.PORT || 80);
}

module.exports = {
    start,
};