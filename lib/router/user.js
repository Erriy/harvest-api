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

const default_invite_code = process.env.INVITE_CODE;

router.post('/regist', async (req, res)=>{
    const {username, password, invite_code} = req.body;
    assert.ok(username.length >= 5 && username.length <= 20, 'username length must be 5-20');
    assert.ok(password.length === 128, 'password length must be 128');
    assert.ok(invite_code.length === 36, 'invite_code length must be 36');
    let inviter = null;
    if (invite_code !== default_invite_code) {
        inviter = await mongo.db.collection('user').findOne({invite_code});
        assert.ok(inviter, 'invite_code is invalid');
        inviter = inviter.username;
    }
    try{
        await mongo.db.collection('user').insertOne({
            username,
            password,
            inviter,
            invite_code: uuid.v4(),
        });
        res.status(200).json({
            code   : 200,
            message: 'ok',
        });
    }catch(e) {
        if (e.code === 11000) {
            return res.status(400).json({
                code   : 400,
                message: 'username is already taken',
            });
        }
        throw e;
    }
});

router.post('/login', async (req, res)=>{
    const {username, password} = req.body;
    assert.ok(username, 'username required');
    assert.ok(password, 'password required');
    assert.ok(password.length === 128, 'password must be 128 bytes');

    const user = await mongo.db.collection('user').findOne({username, password});
    assert.ok(user, 'invalid username or password');

    const token = uuid.v1();
    await redis.client.setEx(`token:${token}`, 60, JSON.stringify({
        id         : user._id,
        username   : user.username,
        invite_code: user.invite_code,
        inviter    : user.inviter,
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

router.get('', login.require, async (req, res)=>{
    res.status(200).json({
        code   : 200,
        message: 'ok',
        info   : {
            username   : req.session.username,
            inviter    : req.session.inviter,
            invite_code: req.session.invite_code,
        }
    });
});

module.exports = {
    async router () {
        const index_name = 'unique_index_username';
        const list = await mongo.db.listCollections({name: 'user'}).toArray();
        if(list.length === 0) {
            await mongo.db.createCollection('user');
            await mongo.db.collection('user').createIndex({username: 1}, {unique: true, name: index_name});
            await mongo.db.collection('user').createIndex({invite_code: 1}, {unique: true, name: 'unique_index_invite_code'});
        }
        return router;
    },
    login,
};