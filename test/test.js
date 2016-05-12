var chai = require('chai'),
	expect = chai.expect,
	assert = chai.assert,
	should = chai.should();

var seneca = require('seneca')();
//seneca.client();
seneca.use('../index.js')

//=========== mock data ============
var mock_dt = {
	"status": "success",
	"data": {
		"candles": [
			["2015-12-28T09:15:00+0530", 1386.4, 1388, 1381.05, 1200, 788]
		]
	}
}

var columns = ['timestamp', 'open', 'high', 'low', 'close', 'volume'];

var data = mock_dt.data.candles[0].reduce(function(result, field, index) {
	result[columns[index]] = field;
	return result;
}, {});
//==================================

describe('api:data', function() {
	describe('#query/list:false', function() {
		it('should return an array of stock eod value', function(done) {
			seneca.act('role:data,cmd:query,list:false', {
				symbol: 'YESBANK',
				q: 't-52w'
			}, function(err, val) {
				should.not.exist(err);
				should.exist(val);
				expect(val).to.be.an('object');
				expect(val.success).to.be.true;
				expect(val.data).to.be.an('object');
				done();
			})
		});
	});
});