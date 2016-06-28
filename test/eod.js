var chai = require('chai'),
    expect = chai.expect,
    assert = chai.assert,
    should = chai.should();
	// ###### initializing test server ########
var intialize_server = require('./init_test_server.js')
var seneca;
//=========== mock data ============
// var mock_dt = {
// 	"status": "success",
// 	"data": {
// 		"candles": [
// 			["2015-12-28T09:15:00+0530", 1386.4, 1388, 1381.05, 1200, 788]
// 		]
// 	}
// }
// var columns = ['timestamp', 'open', 'high', 'low', 'close', 'volume'];
// var data = mock_dt.data.candles[0].reduce(function(result, field, index) {
// 	result[columns[index]] = field;
// 	return result;
// }, {});
var mock_dt = {
        data: ['YESBANK', 'SHILPI']
    }
    //==================================
	before('check test server initialization', intialize)
	after('close server', close_seneca)
		//==========`=== tests ==============
	describe('role:data,comp:eod,cmd:download', check_eod_download);
	
function check_eod_download() {
	this.timeout(50000);
    it('should return an array of eod values downloaded from server', function(done) {
        seneca.act('role:data,comp:eod,cmd:download', mock_dt, function(err, val) {
            if(err) done(err)
            should.exist(val);
            expect(val).to.be.an('object');
            expect(val.success).to.be.true;
            //expect(val.download_count).to.equal(2)
            // expect(val.data).to.be.an('object');
            done();
        })
    })
}

function intialize(done) {
	intialize_server.start().then(function(my_seneca) {
		//console.log(my_seneca)
		seneca = my_seneca
		seneca.client({
			host: 'localhost',
			port: '8080'
		});

		seneca.ready(function() {
			done()
		})
	}).catch((e)=>{done(e)})
}

function close_seneca(done) {
	//console.log('closing seneca instance')
	//quandl.get("NSE/YESBANK", authtoken="1CzVT1zp5yzCQjQNq8yR", start_date="2013-06-08")
	seneca.close(done)
}