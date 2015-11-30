var YGeo = require('../ygeocoder');
var db = require('@reijii/mydb');

db.init({
	"user": "",
	"password": "",
	"socketPath": "/tmp/mysql.sock",
	"database": "",
	"connectionLimit": 10
});

var addr = {
	ok: 'Москва, Лубянка, 37',
	fail: 'Москвабад, Лубянковская, 137'
};

exports.createCoder = function (test) {
	var ygc = new YGeo({db: db});
	test.equal(typeof ygc, 'object', 'must be an object');
	test.done();
};

exports.decodeAddress = function (test) {
	var ygc = new YGeo({db: db});
	var res;

	test.expect(3);
	res = ygc.decode(function(data){
		test.ok(data && data.lat && data.lon, 'uncached error');
		ygc.decode(function(data){
			test.ok(data && data.lat && data.lon, 'cache error');
			test.done();
		}, addr.ok);
	}, addr.ok, {noCache: true});
	test.ok(res, 'error while request');
};

exports.decodeAddressNoDb = function (test) {
	var ygc = new YGeo();

	test.expect(1);
	res = ygc.decode(function(data){
		test.ok(data && data.lat && data.lon);
		test.done();
	}, addr.ok);
};

exports.decodeAddressShit = function (test) {
	var ygc = new YGeo({db: db});

	test.expect(1);
	ygc.decode(function(data){
		data && data.lat && console.log('addr: %s, lat: %s, lon: %s', addr.fail, data.lat, data.lon);
		test.ok(!(data && data.lat && data.lon));
		test.done();
	}, addr.fail);
};
