var mysql = require('mysql');

var util = require('util');

var conn = mysql.createConnection({
  host: 'bkudzgyjtxpv4p9ti1c4-mysql.services.clever-cloud.com', 
  user:'u35mczdxqvxcyoti',
    password:'I6L648MB57MPvN8rjWQx',
    database:'bkudzgyjtxpv4p9ti1c4'
});

var exe = util.promisify(conn.query).bind(conn);

module.exports = exe
  