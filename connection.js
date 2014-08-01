var Promise = require('bluebird');

function Connection(client){
	this.client = client;
}
Connection.prototype.query=function (query,params){
	var self = this;
	return new Promise(function (resolve,reject){
		self.client.query(query,params,function (err,result){
			if(err){
				reject(err);
			}
			else{
				resolve(result);
			}
		});
	});
}

module.exports = Connection;