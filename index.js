var Promise = require("bluebird");
var pg = require("pg");
var Connection = require("./connection.js");

/*
	config=
	{
		host     : "localhost",
		user     : "username",
		password : "password",
		database : "dbname",
	}
 */
function PostgreSQL(config){
	this.configString = "postgres://" + config.user + ":" + config.password + "@" + config.host + "/" + config.database;
}
PostgreSQL.prototype.query = function (query,params) {
	var self = this;
	return new Promise(function (resolve,reject) {
		pg.connect(self.configString,function (err,client,done) {
			if (err){
				reject(err);
			}
			else {
				client.query(query,params,function (err,result) {
					done();
					if (err){
						reject(err);
					}
					else {
						resolve(result);
					}
				});
			}
		});
	});
}
PostgreSQL.prototype.getConnection = function (func) {
	var self = this;
	return new Promise(function (resolve,reject) {
		pg.connect(self.configString,function (err,client,done) {
			if (err){
				reject(err);
			}
			else {
				var connection = new Connection(client);
				Promise.resolve(func(connection))
				.then(function (val) {
					resolve(val);
				})
				.catch(function (err) {
					reject(err);
				})
				.finally(function () {
					return connection.reset()
					.then(function () {
						done();//put the connection back in the pool
					});
				});
			}
		});
	});
}
PostgreSQL.prototype.notify = function (channel, msg){
	if (msg){
		//TODO use pgnotify method to use params
		return this.query('notify "' + channel + '", \'' + msg + '\'');
	}
	else{
		return this.query('notify "' + channel + '"');
	}
}
module.exports = PostgreSQL;