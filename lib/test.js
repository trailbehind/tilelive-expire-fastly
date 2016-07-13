var tilelive = require("tilelive"); 

// A tilelive provider that returns solid colored tiles
var solid = require("tilelive-solid"); 
var s = new solid(tilelive), 
	source; 
tilelive.load("solid:#fff", function(err, data){
 	if(err){
 		console.log(err); 
 	}else{
 		return data; 
 	}
}); 
