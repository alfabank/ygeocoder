const https = require('https');

class GeoCoder {
	constructor(config = {}) {
		config.debug = config.debug || false;
		config.cacheTable = config.cacheTable || 'geocoder_cache';
		config.apiKey = config.apiKey || '';
		config.sleep = config.sleep || 30 ;
		
		this.config = config;
		this.db = this.config.db;
	}

	decode(text, params = {}) {
		if (!text) {
			return Promise.reject({ error: 'no address' });
		}

		const address = text
			.replace(/&(quot|laquo|raquo);|[“”«»]/g, '"')
			.replace(/\s/g, '+');

		return new Promise((resolve, reject) => {
			if (this.db && !(params.noCache || params.makeRequest)) {
				this._getFromCache(address)
					.then((result) => {
						if (!result) {
							this.decode(address, Object.assign({}, params, { makeRequest: true }))
								.then((result) => {
									resolve(result);
								})
								.catch(err => reject(err));
						} else {
							resolve(result);
						}
					})
					.catch(err => reject(err));
			} else {
				this._loadData(address, params)
					.then((result) => {
						resolve(result);
					})
					.catch(err => reject(err));
			}
		});
	}

	_loadData(address, params) {
		const apiKey = this.config.apiKey ? `&key=${this.config.apiKey}` : '';
		const url = `/1.x/?format=json&geocode=${address}${apiKey}`.replace(/ /g, '+');

		return new Promise((resolve, reject) => {
			const req = https.get(
				{
					hostname: 'geocode-maps.yandex.ru',
					path: encodeURI(url),
					port: 443,
					headers: {
						'user-agent': 'alfabank.ru',
						'accept-language': 'ru-RU,ru;q=0.8,en-US;q=0.6,en;q=0.4'
					}
				},
				(res) => {
					let data = '';

					res.setEncoding('utf8');
					res.on('data', (chunk) => {
						data += chunk;
					});

					res.on('end', () => {
						try{
							const resp = JSON.parse(data.toString('utf8')).response;
							if (resp.GeoObjectCollection.metaDataProperty.GeocoderResponseMetaData.found > 0) {
								const geo = resp.GeoObjectCollection.featureMember[0].GeoObject.Point.pos.split(' ');
								const result = {
									lat: parseFloat(geo[1]) || 0,
									lon: parseFloat(geo[0]) || 0
								};
								if (this.db && !params.noCache && result.lat && result.lon) {
									this._saveToCache(address, result);
								}
								resolve(result);
							}
						} catch (e) {
							return reject(e);
						}
					});
				}
			);

			req.on('error', (e) => {
				reject(e);
			});

			req.end();
		});
	}

	_getFromCache(address) {
		return this.db.query(`SELECT lon, lat FROM ${this.config.cacheTable} WHERE address = '${address}'`)
			.then(({rows: result}) => {
				if (!result || !result[0]) {
					return Promise.resolve();
				} else {
					Promise.resolve({
						lat: parseFloat(result[0].lat) || 0,
						lon: parseFloat(result[0].lon) || 0
					});
				}
			});
	}

	_saveToCache(address, geo) {
		this.db.query(`REPLACE INTO ${this.config.cacheTable} (dt, address, lat, lon) VALUES (NOW(), '${address}', '${geo.lat}', '${geo.lon}')`);
	}
}

module.exports = GeoCoder;
