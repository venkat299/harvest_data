// =======================
// private lib
// =======================

var single = function(opt, cb) {
	var data = opt.data
	var id = opt.symbol

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

	cb(null, {
		success: true,
		data: data
	});
}



module.exports.single = single;