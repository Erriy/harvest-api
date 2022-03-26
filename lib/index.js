const express = require('express');
require('express-async-errors');
const assert = require('assert');
const cookie_parser = require('cookie-parser');
const cors = require('cors');
const winston = require('winston');
const express_winston = require('express-winston');
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
    // fixme 跨域安全性测试
    app.use(cors());

    app.use(express_winston.logger({
        transports : [ new winston.transports.Console()],
        format     : winston.format.prettyPrint(),
        ignoreRoute: function (req, res) {
            return req.path === '/healthy';
        },
    }));

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

    app.listen(parseInt(port), ()=>{
        logger.info(`server started at port ${port}`);
    });
}

if (module === require.main) {
    start(process.env.PORT || 80);
}

module.exports = {
    start,
};