/*
    Exports and Requirements 
*/ 
module.exports = ExpireFastly;
var tilelive = require("tilelive"),
    fs = require('fs'),  
    Q = require("q"),
    request = require("request"); 

/*
    Constructor
*/ 
function ExpireFastly(uri, callback) { 
    
    function readFilePromise(uri){ 
        var deferred = Q.defer(); 
        fs.readFile(uri.path,'utf8', function(err,data){
            if(err){
                deferred.reject(err); 
                console.log("Error in reading " + uri); 
            }else{
                content = JSON.parse(data); 
                deferred.resolve(content); 
            }
        });
        return deferred.promise; 
    }   

    var superThis = this; 

    readFilePromise(uri)
        .then(function(){
            superThis._source = content.source; 
            superThis._host = content.host; 
            superThis._fastly_api_key = content.fastlyApiKey;  
            superThis._surrogate_key = content.surrogateKeyTemplate;

            callback(null, superThis); 
    }); 

    // Returns undefined otherwise
    return undefined; 
}

/*
    Register protocol with tilelive 
*/ 
ExpireFastly.registerProtocols = function(tilelive) {
        tilelive.protocols['expire:'] = ExpireFastly;
};
ExpireFastly.registerProtocols(tilelive);

/*
    Class methods 
*/ 
ExpireFastly.prototype.putTile = function(z, x, y, data, callback){

    var surrogate_key_pattern = this._surrogate_key, // z{{zoom}}/x{{x}}/y{{y}}
        api_key = this._fastly_api_key, 
        host = this._host;  

    var surrogate_key = surrogate_key_pattern
        .replace("{{zoom}}", z)
        .replace("{{x}}", x)
        .replace("{{y}}", y); 
    
    function load_source(s){
        // Function that loads the json specified source 
        var deferred = Q.defer(); 
        tilelive.load(s, function(err,src){
            if(err){
                console.log("error loading source : " + this._source); 
                deferred.reject(err); 
            }else{
                deferred.resolve(src); 
            }
        }); 
        return deferred.promise; 
    }

    function updateTile(src){
        // Function that calls putTile on the source which is the actual destination of the tile 
        var deferred = Q.defer(); 
        src.putTile(z, x, y, data, function(err){
            if(err){
                console.log(err); 
                deferred.reject(err);
            }else{
                 deferred.resolve(src);                 
            }
        }); 
        return deferred.promise; 
    }

    function expire_tile_from_fastly(){
        // Function that fires an http request to the fastly API to purge the tile 
        var service_id = "", // Got it with a Fastly account or is-it like "topo", "osm" ?  
            content = {"Fastly-Key":api_key};
        var objJSON = JSON.stringify(content);
        var options = {
            url: host + 'service/' + service_id + '/purge/' + surrogate_key,    
            method: 'POST',
            body: objJSON,
            headers: {
                'Content-Type': 'application/json',
            }
        }; 
        // Debug commands 
        console.log("URL : " + options.url); 
        console.log("body : " + options.body); 

        request(options, function (err, response, body){
            if(err){
                console.log("Error to post : " + objJSON + "because " + err);
                callback(err); 
            } else { 
                if(response.statusCode===200){
                    console.log("Succesfully purge the tile from the Fastly cache"); 
                    callback(null); // Call the callback of the original putTile call
                }
                console.log("Status code : " + response.statusCode); 
                callback(response.statusCode); 
            }
        }); 
    } 

    // (1) load the source (2) Call putTile on the source (3) Expire the fastly cache 
    load_source(this._source)
        .then(updateTile)
        .then(expire_tile_from_fastly); 
}

/*
    Class methods that gets forwarded
*/

ExpireFastly.prototype.startWriting = function(callback){ 
    callback(null);
}

/* Those ones are not called in the current implementation of 
   tile-squirrel but are part of the tilelive API */ 

ExpireFastly.prototype.stopWriting = function(callback){ 
    callback(null);
}

ExpireFastly.prototype.putInfo = function(info, callback){ 
    callback(null);
}
