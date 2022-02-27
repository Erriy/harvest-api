const express = require('express');
require('express-async-errors');
const assert = require('assert');
const logger = require('./logger');
const router = require('./router');
const mysql = require('./mysql');

async function start (port) {
    await mysql.init();

    const app = express();

    app.use(express.json({limit: '5mb'}));
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