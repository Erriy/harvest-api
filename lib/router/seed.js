const assert = require('assert');
const crypto = require('crypto');
const deep_sort_object = require('deep-sort-object');
const express = require('express');
require('express-async-errors');
const router = express.Router();
const mysql = require('../mysql');

function seed_sha512 (obj) {
    const new_obj = JSON.parse(JSON.stringify(obj));
    new_obj.sha512 = undefined;
    return crypto
        .createHash('sha512')
        .update(JSON.stringify(deep_sort_object(new_obj)))
        .digest('hex');
}

router.put('', async (req, res)=>{
    assert.ok(req.body instanceof Array, 'body must be an array');
    assert.ok(req.body.length > 0, 'body must not be empty');
    assert.ok(req.body.length <= 1000, 'body must not be more than 1000');
    req.body.every(s=>{
        assert.ok(s.uri, 'uri must be specified');
        assert.ok(s.name, 'name must be specified');
    });

    await mysql.query(`
        insert ignore into seed(
            sha512, name, uri, create_time, json
        ) values ?
    `, [req.body.map(s=>{
        const create_ts = s.time && s.time.create ? s.time.create : new Date().getTime() / 1000;
        return [
            seed_sha512(s),
            s.name || null,
            s.uri,
            new Date(create_ts * 1000),
            JSON.stringify(s),
        ];
    })]);

    res.status(200).json({
        code   : 200,
        message: 'ok',
    });
});

router.get('', async (req, res)=>{
    let {uri, limit, last, tags,} = req.query;

    limit = parseInt(limit) || 10;
    assert.ok(limit >= 0 && limit <= 1000, 'limit must be between 0 and 1000');

    const seeds = await mysql.query(`
        select json from seed
        limit ?
    `, [limit]);
    return res.status(200).json({
        code : 200,
        seeds: seeds.map(s=>JSON.parse(s.json)),
    });
});

router.get('/:sha512', async (req, res)=>{
});

module.exports = {
    async router () {
        await mysql.query(`
            create table if not exists seed (
                sha512 varchar(128) not null,
                name text not null,
                uri text not null,
                create_time datetime not null,
                json json not null,
                primary key (sha512)
            )
        `);
        return router;
    }
};