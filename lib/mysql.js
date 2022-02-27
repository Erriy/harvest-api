const mysql = require('mysql');

const obj = {
    /**
     * @type {mysql.Pool}
     */
    mysql_connection_pool: null,
    config               : {
        host    : process.env.MYSQL_HOST || 'localhost',
        port    : process.env.MYSQL_PORT || 3306,
        user    : process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD || '123456',
        database: process.env.MYSQL_DATABASE || 'harvest',
    }
};

async function query (...args) {
    return new Promise((resolve, reject)=>{
        obj.mysql_connection_pool.query(...args, (err, result)=>{
            err ? reject(err) : resolve(result);
        });
    });
}

async function init () {
    const create_database = ()=>new Promise((resolve, reject)=>{
        const pool = mysql.createPool({
            connectionLimit: 1,
            host           : obj.config.host,
            port           : obj.config.port,
            user           : obj.config.user,
            password       : obj.config.password,
        });
        pool.query(`create database if not exists ${obj.config.database}`, (err, result)=>{
            pool.end();
            err ? reject(err) : resolve(result);
        });
    });

    await create_database();

    obj.mysql_connection_pool = mysql.createPool({
        connectionLimit: 10,
        ...obj.config,
    });
    process.on('exit', ()=>{
        obj.mysql_connection_pool.end();
    });
}

module.exports = {
    init,
    query,
};