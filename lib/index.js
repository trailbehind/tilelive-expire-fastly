// Some requirements 
var tilelive = require("tilelive"), 
	fs = require('fs'), 
	request = require("request");

// def of debug and error 
var debug = require("debug")("tilelive-expire-fastly"),
 	error = require("debug")("tilelive-expire-fastly:error"); 

// Available from outside the module 
module.exports = ExpireFastly; 

// Some tests
// var uri = 'test.json'; 
// ExpireFastly(uri, function(){
// 	console.log("done"); 
// }); 

function ExpireFastly(uri, callback) { 
	// reads the json file 
	fs.readFile(uri, 'utf8', function(err,data){
		if(err){
			error("Error : " + err); 
			callback(err);  
		} else { 
			data = JSON.parse(data); 
			} 
		// Get the info to purge the fastly cache
		this._source = data.source; 
		this._host = data.host; 
		this._fastly_api_key = data.fastlyApiKey;  
		this._surrogate_key = data.surrogateKeyTemplate;

		// Successful operation and return "this" 
		callback(null, this); 
	}); 
	// In case the callback is not called - returns undefined 
	return undefined; 
}

// Register protocols with tilelive 
ExpireFastly.registerProtocols = function(tilelive) {
    tilelive.protocols['expire_fastly:'] = ExpireFastly;
};

// When a tile gets updated (putTile function) : need to remove the old one from the cache
ExpireFastly.prototype.putTile = function(z, x, y, data, callback){

	var surrogate_key_pattern = this._surrogate_key, // z{{zoom}}/x{{x}}/y{{y}}
		api_key = this._fastly_api_key; 

	var surrogate_key = surrogate_key_pattern
		.replace("{{zoom}}", z)
		.replace("{{x}}", x)
		.replace("{{y}}", y); 

	this._expire_tile_from_fastly(surrogate_key, api_key, 
		function(err,data){
			if(err){ 
				error("Error to purge the tile : " + z + "/" + x + "/" y); 
				callback(err); 
			} else {
				debug("Finish purging the tile : " + z + "/" + x + "/" y); 
				callback(null); 
			} 
	}); 
}

ExpireFastly.prototype._expire_tile_from_fastly = function(surrogate_key, api_key, callback){
 	// Function to fire an http request to purge the tile 
	var service_id = "", // Got it with a Fastly account 
		content = {"Fastly-Key":api_key, "Accept":"application/json"};
	var objJSON = JSON.stringify(content); 
		
	request({
		url: "https://api.fastly.com/service/" + service_id + "/purge/" + surrogate_key,
		method: "POST",
		json: true,   
		body: objJSON
		}, 
		function (err, response, body){
			if(err){
				console.log("Error to post : " + body + "because " + err);
				callback(err); 
			} else { 
				console.log(response);
				callback(null); 
			}
	});
}

// Functions that get forwarded
ExpireFastly.prototype.getTile = function(z, x, y, callback){ 
	callback(null);
}

ExpireFastly.prototype.getInfo = function(callback){ 
	callback(null);
}

ExpireFastly.prototype.startWriting = function(callback){ 
	callback(null);
}

ExpireFastly.prototype.stopWriting = function(callback){ 
	callback(null);
}

ExpireFastly.prototype.putInfo = function(info, callback){ 
	callback(null);
}
