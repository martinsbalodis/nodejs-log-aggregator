var net = require('net');

/**
 * Log container
 */
var Log = function(){
	
	this.logs = {};
	
	// agregate data every 10 seconds
	this.agregate_interval = 10*1e3;
	
	/**
	 * [log_group][min/max/avg][time] = value
	 */
	this.agregated_logs = {};
	
	this.add_log = function(title, data) {
		
		if(typeof this.logs[title] === 'undefined') {
			this.logs[title] = [];
		}
		
		this.logs[title].push(data);
		
	};
	
	this.agregate_log = function() {
		
		for(var title in this.logs) {
			
			var sum = null;
			var max = null;
			var avg = null;
			
			for(var i in this.logs[title]) {
				
				sum += this.logs[title][i];
				if(max < this.logs[title][i]) {
					max = this.logs[title][i];
				}
				
			}
			
			if(this.logs[title].length) {
				avg = sum/this.logs[title].length;
			}
			
			// clear data
			this.logs[title].splice(0, this.logs[title].length);
			
			var time = Math.floor((new Date()).getTime()/1000);
			
			if(typeof this.agregated_logs[title] === 'undefined') {
				this.agregated_logs[title] = {
					sum:{},
					max:{},
					avg:{}
					
				};
			}
			
			this.agregated_logs[title]['sum'][time] = sum;
			this.agregated_logs[title]['max'][time] = max;
			this.agregated_logs[title]['avg'][time] = avg;
			
		}
		
	};
	
	this.init = function() {
		
		var that = this;
		
		// Agregate logs every x seconds
		setInterval(function(){
			that.agregate_log.call(that);
		},this.agregate_interval);
	};
	
	this.get_logs = function(group, type, time_from, time_to){
		
		var response = {};
		if(typeof this.agregated_logs[group] !== 'undefined') {
			
			for(var time in this.agregated_logs[group][type]) {
				
				if(time>= time_from && time <= time_to) {
					
					response[time] = this.agregated_logs[group][type][time];
				}
				
			}
			
		}
		
		return response;
	};
	
};

logs = new Log();

logs.init();

// logging server
var log_server = net.createServer(function (socket) {
	
	socket.on("data", function(data) {
		
		data = JSON.parse(data);
		
		for(var i in data) {
			logs.add_log(data[i].group, data[i].value);
		}
		
		socket.end();
		
	});
	
});
log_server.listen(1337, '127.0.0.1');

// log retrieval server
var log_retrieval_server = net.createServer(function (socket) {
	
	socket.on("data", function(data) {
		
		data = JSON.parse(data);
		
		var response = logs.get_logs(data.group, data.type, data.time_from, data.time_to);
		
		socket.end(JSON.stringify(response));
		
	});
	
});

log_retrieval_server.listen(1338, '0.0.0.0');