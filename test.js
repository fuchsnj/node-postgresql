var PostgreSQL = require("./index.js");
var assert = require('assert');

describe('Constructor',function(){
	it('should create connection uri from config',function(){
		assert(new PostgreSQL({
			host     : "host",
			user     : "username",
			password : "password",
			database : "dbname",
		}).configString === "postgres://username:password@host/dbname");
	});
});