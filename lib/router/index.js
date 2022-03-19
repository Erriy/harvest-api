const express = require('express');
const seed = require('./seed');
const user = require('./user');

module.exports = {
    async router () {
        const router = express.Router();
        router.use(user.login.session);
        router.use('/user', await user.router());
        router.use('/seed', await seed.router());
        return router;
    }
};