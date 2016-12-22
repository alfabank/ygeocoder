const YGeo = require('../ygeocoder');
const db = require('mydb');

db.init({
	user: '',
	password: '',
	socketPath: '/tmp/mysql.sock',
	database: '',
	connectionLimit: 10
});

const addr = {
	ok: 'Москва, Лубянка, 37',
	fail: 'Москвабад, Лубянковская, 137'
};

exports.createCoder = (test) => {
	const ygc = new YGeo({ db });
	test.equal(typeof ygc, 'object', 'must be an object');
	test.done();
};

exports.decodeAddress = (test) => {
	const ygc = new YGeo({ db });

	test.expect(2);
	ygc.decode(addr.ok, { noCache: true })
		.then((data) => {
			test.ok(data && data.lat && data.lon, 'uncached error');

			ygc.decode(addr.ok)
				.then((data) => {
					test.ok(data && data.lat && data.lon, 'cache error');
					test.done();
				});
		});
};

exports.decodeAddressNoDb = (test) => {
	const ygc = new YGeo();

	test.expect(1);

	ygc.decode(addr.ok)
		.then((data) => {
			test.ok(data && data.lat && data.lon);
			test.done();
		});
};

exports.decodeAddressShit = (test) => {
	const ygc = new YGeo({ db });

	ygc.decode(addr.fail)
		.then(() => {
			test.fail();
		})
		.catch(() => {
			test.done();
		});
};
