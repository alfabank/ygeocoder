var df = require('@reijii/adjourn');
var sprintf = require('sprintf').sprintf;
var https = require('https');
var http = require('http');

var GeoCoder = function (config) {
	this.config = this._initConfig(config);
	this.db = this.config.db;
};

GeoCoder.prototype.decode = function (callback, address, params) {
	var that = this;
	var w = df();

	params = params || {};

	if (typeof callback != 'function') {
		throw new TypeError('callback must be a function');
	}
	if (!address) {
		return null;
	}
	address = this._cleanAddress(address);

	if (!params.noCache) {
		w.when({
			code: 'cache',
			func: this._getCached,
			arguments: [address],
			context: this
		}).then(function(data){
			if (data.cache && data.cache.lat) {
				callback({
					lat: parseFloat(data.cache.lat) || 0,
					lon: parseFloat(data.cache.lon) || 0
				});
			} else {
				that.decode(callback, address, {
					sleep: params.sleep,
					noCache: true,
					writeCache: !(params.noCache === true)
				});
			}
		});
	} else {
		w.wait(function(callback){
			setTimeout(callback, params.sleep || that.config.sleep);
		});
		w.when({
			func: this._getYa,
			context: this,
			arguments: [address],
			code: 'pos'
		});
		w.then(function(data){
			var ww = df().when(function(c){c();});
			if (data && data.pos && data.pos.lat) {
				if (that.db && (!params.noCache || !!params.writeCache)) {
					ww.when({
						func: that._writeCache,
						context: that,
						arguments: [address, {lat: data.pos.lat, lon: data.pos.lon}]
					})
				}
				ww.then(function(){
					callback({
						lat: parseFloat(data.pos.lat) || 0,
						lon: parseFloat(data.pos.lon) || 0,
					});
				});
			} else {
				callback(null);
			}
		});
	}
	return true;
}

GeoCoder.prototype._getYa = function (callback, address) {
	var url;
	var req;

	url = sprintf('/1.x/?format=json&geocode=%s%s',
		address,
		(this.config.apiKey ? '&key=' + this.config.apiKey : '')
	).replace(/ /g, '+');

	req = https.get({
		hostname: 'geocode-maps.yandex.ru',
		path: encodeURI(url),
		port: 443,
		headers: {
			'user-agent': 'alfabank.ru',
 			'accept-language': 'ru-RU,ru;q=0.8,en-US;q=0.6,en;q=0.4'
		}
	}, function (res) {
		var data = '';
		res.setEncoding('utf8');
		res.on('data', function(chunk){
			data += chunk;
		});
		res.on('end', function(){
			var d = data.toString('utf8');
			var yGeo;
			var geo;

			try{
				d = JSON.parse(d);
			} catch (e) {
				callback();
				return;
			}

			if (d && d.response.GeoObjectCollection) {
				yGeo = d.response.GeoObjectCollection;
				//console.log(yGeo);
			}
			if (
				yGeo
				&& yGeo.metaDataProperty
				&& yGeo.metaDataProperty.GeocoderResponseMetaData
				&& yGeo.metaDataProperty.GeocoderResponseMetaData.found > 0
			) {
				geo = d.response.GeoObjectCollection.featureMember[0].GeoObject.Point.pos.split(' ');
				callback({
					lat: geo[0],
					lon: geo[1],
				});
			} else {
				callback();
			}
		});
	}).on('error', function(e) {
		throw e;
	});
};
GeoCoder.prototype._getCached = function (callback, address) {
	var sql = sprintf("SELECT lon, lat FROM %s WHERE address = '%s' AND dt + INTERVAL %s > NOW()",
		this.config.cacheTable,
		address,
		this.config.cacheInterval
	);
	if (!this.db) {
		callback(null);
		return;
	};
	this.db.query(sql, function(error, rows){
		if (error) throw error;
		if (rows && rows.length) {
			callback({
				lat: rows[0].lat,
				lon: rows[0].lon
			});
		} else {
			callback(null);
		}
	});
};
GeoCoder.prototype._writeCache = function (callback, address, geo) {
	if (!this.db) {
		callback();
		return;
	}
	this.db.query(
		sprintf("REPLACE INTO %s (dt, address, lat, lon) VALUES (NOW(), '%s', '%s', '%s')",
			this.config.cacheTable,
			address,
			geo.lat,
			geo.lon
		), function(error){
			if (error) throw error;
			callback();
		}
	);
}
GeoCoder.prototype._cleanAddress = function (address) {
	return address
		.replace(/&(quot|laquo|raquo);|[“”«»]/g, '"')
		.replace(/\s/g, '+');
};
GeoCoder.prototype._initConfig = function (config) {
	config = config || {};
	config.debug = config.debug || false;
	config.cacheInterval = config.cacheInterval || '6 MONTH';
	config.cacheTable = config.cacheTable || 'geocoder_cache';
	config.apiKey = config.apiKey || '';
	config.sleep = config.sleep || 30 ;

	return config;
};

module.exports = GeoCoder;
