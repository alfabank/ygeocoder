# YGeoCoder

**Version 0.2.0**

## Purpose
A simple to determine geo coordinates by address trouth Yandex.Maps.

## Installation
Via [npm](http://github.com/isaacs/npm):
```
npm install alfabank/ygeocoder.git
```

From github:
```
git clone https://github.com/alfabank/ygeocoder.git
```

## Example
```javascript
const YGeoCoder = require('ygeocoder');
const ygc = new YGeoCoder();
	
ygc.decode('Москва')
	.then((geo) => {
		console.log(`Координаты Москвы: ${geo.lat} ${geo.lat}`);
	})
	.catch(() => {
		console.log('Координаты Москвы неизвестны');
	});
```

## API

### Constructor
```javascript
new YGeoCoder({
	// debug flag
	debug: false,
	
	// yandex API key
	apiKey: '',
	
	// sleep interval between requests, ms
	sleep: 30,
	
	// cache options
	// cache will work only if db object passed
	// alfabank/mydb object
	db: db,
	
	// cache table
	cacheTable: 'geocoder_cache'
});
```

### .decode(address[, params])
Get coordinates from Yandex.Map. Then function will receive object with _lat_ and _lon_ fields or _null_.
```javascript
"params": {
	// not use cached results
	"noCache": false,
	// sleep interval between requests
	"sleep": 30
}
```
