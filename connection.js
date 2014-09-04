var Promise = require("bluebird");

function Connection(client,done){
	var self=this;
	this.done = done;
	this.client = client;
	this.listeners = {};

	//must queue tasks to prevent race condition between removing and adding a listener to the db
	this.listenerQueue = Promise.resolve();
	this.client.on("notification",function (msg) {
		var array = self.listeners[msg.channel];
		if(array){
			for(var a=0; a<array.length; a++){
				array[a](msg.payload);
			}
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
Connection.prototype.listen = function (channel,callback){
	var self=this;
	self.listenerQueue = self.listenerQueue.then(function(){
		if(self.listeners[channel]){
			self.listeners[channel].push(callback);
		}else{
			self.listeners[channel] = [callback];
		}
		return self.query('listen "'+channel+'"');
	});
	return self.listenerQueue;
}
Connection.prototype.stopListening = function (channel,callback){
	var self = this;
	self.listenerQueue = self.listenerQueue.then(function(){
		if(self.listeners[channel]){
			//self.listeners[channel].push(callback);
			var index = self.listeners[channel].indexOf(callback);
			if(index !== -1){
				self.listeners[channel].splice(index,1);
				if(self.listeners[channel].length === 0){
					delete self.listeners[channel];
					return self.query('unlisten "'+ channel +'"');
				}
			}
			return Promise.resolve();
		}
	});
	return self.listenerQueue;
}
Connection.prototype.notify = function (channel,msg){
	if(msg){
		return this.query('notify "'+channel+'", \''+msg+'\'');
	}else{
		return this.query('notify "'+channel+'"');
	}
}
Connection.prototype.reset = function (){
	var self = this;
	this.client.removeAllListeners();//remove event emitter
	if (hasListener()){
		return this.query("unlisten *");
	}
	return Promise.resolve();
	function hasListener(){
		for (var a in self.listeners) {
			if (self.listeners.hasOwnProperty(a)) {
				return true;
			}
		}
		return false;
	}
}
Connection.prototype.end = function () {
	this.reset();
	this.done();
}

module.exports = Connection;