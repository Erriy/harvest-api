const express = require('express');
require('express-async-errors');
const logger = require('./logger');

async function start (port) {
    const app = express();

    app.use(express.json());

    app.get('/ping', (req, res)=>{
        res.status(200).end('pong');
    });
    app.get('/healthy', (req, res)=>{
        res.status(200).end();
    });

    app.use((err, req, res, next)=>{
        logger.error(err);
        res.status(500).json({
            code   : 500,
            message: '服务器未知错误',
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