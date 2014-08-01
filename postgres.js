var Promise = require('bluebird');
var pg = require('pg');


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
	this.configString="postgres://"+config.user+":"+config.password+"@"+config.host+"/"+config.database;
}
PostgreSQL.prototype.query(var query,var params){
	return new Promise(function(resolve,reject){
		pg.connect(this.configString,function(err,client,done){
			if(err){
				reject(err);
			}else{
				client.query(query,params,function(err,result){
					done();
					if(err){
						reject(err);
					}else{
						resolve(result);
					}
				});
			}
		});
	});
}
PostgreSQL.prototype.getConnection(func){
	return new Promise(function(resolve,reject){
		pg.connect(this.configString,function(err,client,done){
			if(err){
				reject(err);
			}else{
				return Promise.resolve(func(client))
				.finally(function(){
					done();//put the connection back in the pool
				});
			}
		});
	});
}


module.exports=PostgreSQL;