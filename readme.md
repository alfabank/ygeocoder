# YGeoCoder

**Version 0.1.2**

## Purpose
A simple to determine geo coordinates by address trouth Yandex.Maps.

## Installation
Via [npm](http://github.com/isaacs/npm):
```
npm install @reijii/ygeocoder
```

From github:
```
git clone https://github.com/alfabank/ygeocoder.git
```

## Example
```javascript
var YGeoCoder = require('ygeocoder');

var ygc = new YGeoCoder();
ygc.decode(function(data){
	if (data && data.lat) {
		console.log('Координаты Москвы: %s %s', data.lat, data.lon);
	} else {
		console.log('Координаты Москвы неизвестны');
	}
}, 'Москва');
```

## API

### Constructor
```javascript
new YGeoCoder({
	// debug flag
	debug: false,

	// yandex API key
	apiKey: '',

	// sleep interval between requests
	sleep: 30,

	// cache options
	// cache will work only if db object passed
	// @reijii/mydb object
	db: db,
	// cache table
	cacheTable: 'geocoder_cache'
});
```

### .decode(callback, address[, params])
Get coordinates from Yandex.Map and send it to _callback_. Callback recived object with _lat_ and _lon_ fields or _null_.
```javascript
"params": {
	// not use cached results
	"noCache": false,
	// write results into cahce no matter if noCache flag is setted
	"writeCache": null,
	// sleep interval between requests
	"sleep": 30
}
```
