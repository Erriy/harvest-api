const express = require('express');
const seed = require('./seed');

module.exports = {
    async router () {
        const router = express.Router();
        router.use('/seed', await seed.router());
        return router;
    }
};