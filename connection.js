var Promise = require('bluebird');

function Connection(client){
	var self=this;
	this.client = client;
	this.listeners = {};
	this.client.on('notification',function (msg){
		var array = self.listeners[msg.channel];
		if(array){
			for(var a=0; a<array.length; a++){
				array[a](msg.payload);
			}
			delete self.listeners[msg.channel];
		}
	});
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
Connection.prototype.listen = function (channel){
	var self=this;
	var promise1 = new Promise(function (resolve,reject){
		if(self.listeners[channel]){
			self.listeners[channel].push(resolve);
		}else{
			self.listeners[channel] = [resolve];
		}
		return 
	});
	var promise2 = self.query('listen "'+channel+'"');
	return {
		notification: promise1,
		started: promise2
	};
}
Connection.prototype.notify = function (channel,msg){
	if(msg){
		return this.query('notify "'+channel+'", \''+msg+'\'');
	}else{
		return this.query('notify "'+channel+'"');
	}
}
Connection.prototype.reset = function (){
	var self=this;
	if(hasListener()){
		return this.query("unlisten *");
	}
	return Promise.resolve();

	function hasListener(){
		for(var a in self.listeners) { 
		   if (self.listeners.hasOwnProperty(a)) {
		       return true;
		   }
		}
		return false;
	}
}

module.exports = Connection;