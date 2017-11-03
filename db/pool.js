//The pool should be a long-lived object in your application. Generally you'll want to instantiate one pool when your app starts up and use the same instance of the pool throughout the lifetime of your application. If you are frequently creating a new pool within your code you likely don't have your pool initialization code in the correct place
var config = require('config');
const { Pool } = require('pg');

// correct usage: create the pool and let it live
// 'globally' here, controlling access to it through exported methods
const pool = new Pool(config.get('db.postgre'));

// this is the right way to export the query method
module.exports.query = (text, values, callback) => {
    
    //various debug output
    //console.log('query:', text, values);
    console.log('query: <- ' + text);
    
    const start = Date.now()

    return pool.query(text, values, (err, result) => {
        if (err) {
            return callback(err);
        }
        const duration = Date.now() - start
        console.log('query: -> ' + text + ', fetch time  (ms): ' + duration + ', rows: ' + result.rowCount);
        callback(null, result);
    });
}

// this would be the WRONG way to export the connect method
module.exports.connect = () => {
    // notice how we would be creating a pool instance here
    // every time we called 'connect' to get a new client?
    // that's a bad thing & results in creating an unbounded
    // number of pools & therefore connections
    var aPool = new pg.Pool();
    return aPool.connect();
}
