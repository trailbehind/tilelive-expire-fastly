// Some requirements 
var tilelive = require("tilelive"), 
	fs = require('fs'), 
	request = require("request");

// Available from outside the module 
module.exports = ExpireFastly; 

function ExpireFastly(uri, callback) { 
	// reads the json file 
	fs.readFile(json_path, 'utf8', function(err,data){
		if(err){
			console.log("Error : " + err); 
			return; 
		}
		data = JSON.parse(data); 
	});
	// Get the info to purge the fastly cache
	this._source = data.source; 
	this._host = data.host; 
	this._fastly_api_key = data.fastlyApiKey;  
	this._surrogate_key = data.surrogateKeyTemplate; 

	// Successful operation and return "this" 
	callback(null, this); 

	// In case the callback is not called - returns undefined 
	return undefined; 
 
}

// Register protocols with tilelive 
ExpireFastly.registerProtocols = function(tilelive) {
    tilelive.protocols['expire_fastly:'] = ExpireFastly;
};

// putTile 
ExpireFastly.prototype.putTile = function(z, x, y, data, callback){

	var surrogate_key = this._surrogate_key; // TO DO : need to check the format 
	var api_key = this.api_key; 
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

// TO DO : All the others calls gets just forwarded 


ExpireFastly.prototype._expire_tile_from_fastly = function(surrogate_key, api_key, callback){
	// Function to fire an http request to purge the tile 
	request({
    	url: "https://api.fastly.com/",
    	method: "POST",
    	json: true,   
    	body: myJSONObject
		}, 
		function (error, response, body){
    		console.log(response);
	});

}