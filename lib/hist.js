// =======================
// private lib
// =======================

var download = function(opt, cb) {
	var symbol_list = opt.symbol_list 
	var task_list = []

	symbol_list.forEach(function(){
		
	})

	Promise.all()

	// var data = opt.data
	// var id = opt.symbol

	// var mock_dt = {
	// 	"status": "success",
	// 	"data": {
	// 		"candles": [
	// 			["2015-12-28T09:15:00+0530", 100, 100, 100, 100, 1000]
	// 		]
	// 	}
	// }

	// var columns = ['timestamp', 'open', 'high', 'low', 'close', 'volume'];

	// var data = mock_dt.data.candles[0].reduce(function(result, field, index) {
	// 	result[columns[index]] = field;
	// 	return result;
	// }, {});

	// cb(null, {
	// 	success: true,
	// 	data: data
	// });
}



module.exports.download = download;