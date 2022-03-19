const assert = require('assert');
const crypto = require('crypto');
const deep_sort_object = require('deep-sort-object');
const express = require('express');
require('express-async-errors');
const user = require('./user');
const router = express.Router();

function seed_sha512 (obj) {
    const new_obj = JSON.parse(JSON.stringify(obj));
    new_obj.sha512 = undefined;
    return crypto
        .createHash('sha512')
        .update(JSON.stringify(deep_sort_object(new_obj)))
        .digest('hex');
}

router.put('', user.login.require, async (req, res)=>{
    res.status(200).json({
        code   : 200,
        message: 'ok',
    });
});

router.get('', async (req, res)=>{
    res.status(200).json({
        code   : 200,
        message: 'ok',
    });
});

module.exports = {
    async router () {
        return router;
    }
};