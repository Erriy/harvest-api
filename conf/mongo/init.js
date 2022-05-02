db = db.getSiblingDB("testdb");

db.createUser(
    {
        user : 'test',
        pwd  : 'test',
        roles: [
            {
                role: 'readWrite',
                db  : 'testdb'
            }
        ]
    }
);