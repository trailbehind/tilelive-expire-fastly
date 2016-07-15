# tilelive-expire-fastly
Tilelive module for expiring tiles from fastly cdn when a tile is updated

## Usage

```json 
{
 	"topo": {
    	"source": "tmstyle:///path/to/folder.tm2",
    	"destination": "expire://path/to/file.json"
	} 
}

```

where file.json looks like : 

```json 
{
	"source": "s3simple:///path/to/s3",
	"fastlyApiKey": "xxx",
	"host": "https://api.fastly.com/",
	"surrogateKeyTemplate": "z{{zoom}}/x{{x}}/y{{y}}"
}

```