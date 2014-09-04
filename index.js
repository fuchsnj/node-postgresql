var Promise = require('bluebird');
var pg = require('pg');
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
	this.notificationConnection = null;
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

PostgreSQL.prototype.transaction = function (serial,func) {
	var self = this;
	return self.getConnection()
	.then(function(con){
		var start;
		if(serial){
			start = con.query("START TRANSACTION ISOLATION LEVEL SERIALIZABLE");
		}else{
			start = con.query("START TRANSACTION ISOLATION LEVEL READ COMMITTED");
		}
		return start.then(function(){
			return Promise.method(func)(con);
		})
		.tap(function(){
			return con.query("COMMIT");
		})
		.catch(function(err){
			console.log("transaction error:",err);
			return con.query("ROLLBACK");
		});
	});
}
PostgreSQL.prototype.getConnection = function () {
	var self = this;
	return new Promise(function(resolve,reject){
		pg.connect(self.configString,function (err,client,done) {
			if (err){
				reject(err);
			}
			else {
				var connection = new Connection(client,done);
				resolve(connection);
			}
		});
	});

}
PostgreSQL.prototype.notify = function (channel, msg){
	if(msg){
		return this.query('notify "'+channel+'", \''+msg+'\'');
	}else{
		return this.query('notify "'+channel+'"');
	}
}

PostgreSQL.prototype.listen = function(channel,callback) {
	var self = this;
	if(!self.notificationConnection){
		self.notificationConnection = self.getConnection();
	}
	return self.notificationConnection
	.then(function (con) {
		return con.listen(channel,callback);
	});
	//======================================
	function getNotificationConnection() {
		return self.notificationConnection;
	}
}
PostgreSQL.prototype.stopListening = function(channel,callback) {
	//TODO: if this is the last listener, end notificationConnection
	var self = this;
	if(!self.notificationConnection){
		self.notificationConnection = self.getConnection();
	}
	return self.notificationConnection
	.then(function(con){
		return con.stopListening(channel,callback);
	});
}
module.exports = PostgreSQL;