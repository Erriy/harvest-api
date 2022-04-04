const assert = require('assert');
const crypto = require('crypto');
const deep_sort_object = require('deep-sort-object');
const express = require('express');
require('express-async-errors');
const user = require('./user');
const mongo = require('../mongo');
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
    const seeds = req.body;
    const publish_time = new Date();
    seeds.forEach(s => {
        assert.ok(!s.name || ('string' === typeof s.name && s.name.length), 'name must be a string');
        assert.ok(s.uri, 'uri is required');
        assert.ok(s.time, 'time is required');
        assert.ok(s.time.create && typeof s.time.create === 'number', 'time.create must be a number');
        assert.ok(!s.time.update || s.time.update >= s.time.create, 'time.update must be greater than or equal to time.create');
        assert.ok(!s.time.happen || typeof s.time.happen === 'number', 'time.happen must be a number');
        if(s.tags) {
            assert.ok(Array.isArray(s.tags), 'tags must be an array');
            s.tags.forEach(t => {
                assert.ok(typeof t === 'string' && t.length, 'tag must be a string');
            });
        }
        s.time._publish = publish_time;
        s.time.create = new Date(s.time.create);
        s.time.update = new Date(s.time.update || s.time.create);
        s._publisher = req.session.username;
    });
    try{
        await mongo.db.collection('seed').insertMany(seeds, {ordered: false});
    }catch(e) {
        if(e.code !== 11000) {
            throw e;
        }
        const dup_seeds = [];
        const dup_seed_uri_list = [];
        e.result.result.writeErrors.forEach(err => {
            const s = err.err.op;
            dup_seeds.push(s);
            dup_seed_uri_list.push(s.uri);
        });
        await mongo.db.collection('seed').deleteMany({uri: {$in: dup_seed_uri_list}, _publisher: {$eq: req.session.username}});
        await mongo.db.collection('seed').insertMany(dup_seeds, {ordered: false});
    }

    res.status(200).json({
        code   : 200,
        message: 'ok',
    });
});

router.get('', async (req, res)=>{
    // todo 优化翻页查询
    let {limit = 20, page = 1, /*last_uri = '',*/sort = 'uri', ending = 'desc'} = req.query;
    limit = parseInt(limit);
    page = parseInt(page);
    assert.ok(['asc', 'desc'].includes(ending), 'ending must be asc or desc');
    assert.ok(['uri', 'time.happen', 'time.create', 'time.update', 'time._publish'].includes(sort), 'sort must be uri, time.happen, time.create, time.update, time._publish');
    assert.ok(typeof limit === 'number', 'limit must be number');
    assert.ok(0 < limit && limit <= 100, 'limit must be 1-100');
    assert.ok(typeof page === 'number', 'page must be number');
    assert.ok(0 < page, 'page must be greater than 0');
    // assert.ok(!last_uri || typeof last_uri === 'string', 'last_uri must be a string');

    const query = {};
    // if (last_uri) {
    //     query.uri = {[ending === 'asc' ? '$gt' : '$lt']: last_uri};
    // }

    const seeds = await mongo.db.collection('seed')
        .find(query, { projection: {_id: false}}).sort(sort, ending)
        .skip((page - 1) * limit).limit(limit)
        .toArray();

    seeds.forEach(s => {
        s.time.create = s.time.create.getTime();
        s.time.update = s.time.update.getTime();
        if(s.time.create === s.time.update) {
            delete s.time.update;
        }
        if(!s.time.happen) {
            delete s.time.happen;
        }
        s.time._publish = s.time._publish.getTime();
    });

    res.status(200).json({
        code   : 200,
        seeds,
        message: 'ok',
    });
});

module.exports = {
    async router () {
        const list = await mongo.db.listCollections({name: 'seed'}).toArray();

        if (list.length === 0) {
            await (await mongo.db.createCollection('seed')).createIndexes([
                {key: {uri: 1, _publisher: 1}, unique: true},
                {key: {'time.happen.value': 1}, unique: false},
                {key: {'time.create': 1}, unique: false},
                {key: {'time.update': 1}, unique: false},
                {key: {'time._publish': 1}, unique: false},
                {key: {'_publisher': 1}, unique: false},
            ]);
        }
        return router;
    }
};