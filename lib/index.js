/*
    Exports and Requirements 
*/ 
module.exports = ExpireFastly;
var tilelive = require("tilelive"),
    fs = require('fs'),  
    Q = require("q"),
    request = require("request"), 
    handlebars = require("handlebars"); 

/*
    Constructor
*/ 
function ExpireFastly(uri, callback) { 

    var superThis = this;

    function readFilePromise(uri){ 
        var deferred = Q.defer(); 
        fs.readFile(uri.path,'utf8', function(err,data){
            if(err){
                deferred.reject(err); 
                console.log("Error in reading " + uri); 
            }else{
                var content = JSON.parse(data); 
                superThis._source = content.source; 
                superThis._host = content.host; 
                superThis._fastly_api_key = content.fastlyApiKey;  
                superThis._surrogate_key = content.surrogateKeyTemplate;

                deferred.resolve(superThis._source); 
            }
        });
        return deferred.promise; 
    }   

    function load_source(s){
        // Function that loads the json specified source 
        var deferred = Q.defer(); 
        tilelive.load(s, function(err,src){
            if(err){
                console.log("error loading source : " + this._source); 
                deferred.reject(err); 
            }else{
                superThis._loaded = src;  
                deferred.resolve();
                callback(null, superThis); 
            }
        }); 
        return deferred.promise; 
    }

    readFilePromise(uri)
        .then(load_source); 

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

    var template = handlebars.compile(surrogate_key_pattern); 
    var dico = {"zoom":z, "x":x, "y":y}; 
    var surrogate_key = template(dico); 

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
 
    updateTile(this._loaded)
    .then(expire_tile_from_fastly); 
}

/*
    Class methods that gets forwarded if called 
*/
ExpireFastly.prototype.startWriting = function(callback){ 
    callback(null);
}

ExpireFastly.prototype.stopWriting = function(callback){ 
    callback(null);
}

ExpireFastly.prototype.putInfo = function(info, callback){ 
    callback(null);
}

ExpireFastly.prototype.getInfo = function(info, callback){ 
    callback(null);
}

ExpireFastly.prototype.getTile = function(z, x, y, callback){ 
    callback(null);    
}

ExpireFastly.prototype.getTile = function(z, x, y, callback){ 
    callback(null);    
}

ExpireFastly.prototype.putGrid = function(z, x, y, grid, callback){ 
    callback(null);    
}

ExpireFastly.prototype.getGrid = function(z, x, y, callback){ 
    callback(null);    
}
