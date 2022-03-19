const express = require('express');
require('express-async-errors');
const router = express.Router();
const assert = require('assert');
const uuid = require('uuid');
const mongo = require('../mongo');
const redis = require('../redis');

const login = {
    async session (req, res, next) {
        const token = req.cookies.token;
        if(token) {
            let session = await redis.client.get(`token:${token}`);
            if(session) {
                session = JSON.parse(session);
                req.session = {
                    ...session,
                    token: token,
                };
            }
        }
        next();
    },
    async require (req, res, next) {
        if (req.session) {
            return next();
        }
        return res.status(401)
            .cookie('token', '', {httpOnly: true})
            .json({
                code   : 401,
                message: 'login required',
            });
    }
};

router.post('/login', async (req, res)=>{
    const {username, password} = req.body;
    assert.ok(username, 'username required');
    assert.ok(password, 'password required');
    assert.ok(password.length === 128, 'password must be 128 bytes');

    const user = await mongo.db.collection('user').findOne({username, password});
    assert.ok(user, 'invalid username or password');

    const token = uuid.v1();
    await redis.client.setEx(`token:${token}`, 60, JSON.stringify({
        id      : user._id,
        username: user.username,
    }));
    res.status(200)
        .cookie('token', token, {httpOnly: true, })
        .json({
            code   : 200,
            message: 'ok'
        });
});

router.post('/logout', login.require, async (req, res)=>{
    await redis.client.del(`token:${req.session.token}`);
    res.status(200).json({
        code   : 200,
        message: 'ok'
    });
});

module.exports = {
    async router () {
        const index_name = 'unique_index_username';
        const list = await mongo.db.listCollections({name: 'user'}).toArray();
        if(list.length === 0) {
            await mongo.db.createCollection('user');
            await mongo.db.collection('user').createIndex({username: 1}, {unique: true, name: index_name});
        }
        return router;
    },
    login,
};