var Promise = require('bluebird')
var request = Promise.promisifyAll(require("request"));
// =======================
// private lib
// =======================
function eod(options) {
    var seneca = this
        // the logging function, built by init
    var app_config = options.app_config
        // place all the patterns together
        // this make it easier to see them at a glance
    this.add('role:data,comp:eod,cmd:download', download)
    // this is the special initialization pattern
    //this.add('init:eod', init)
    // function init(msg, respond) {
    //   console.log('in init',options)
    //     console.log('initializing component:eod')
    //     app_config = options.app_config
    //     respond()
    // }
    //============== downloads eod data from quandl ======
    function download(opt, cb) {
        //console.log('in download', options)
        var symbol_list = opt.data
        var task_list = []
        var dp_name = app_config.data_provider.current_dp_eod
        var dp = app_config.data_provider
        var format = "json"
        var api_key = ""
        var url = ""
        if (dp_name === 'quandl') {
            url = dp[dp_name].url
            api_key = dp[dp_name].api_key
        }
        url = url.replace(/@api_key/, api_key).replace(/@format/, format)
        symbol_list.forEach(function(symbol) {
            var req_url = (url.replace(/@tradingsymbol/, symbol)) + '&limit=1'
            //console.log('eod downloading:', req_url)
            task_list.push(request.getAsync(req_url))
        })
        Promise.all(task_list).then(function(data) {
            //console.log(data)
            data.forEach((item) => {
                //console.log(item.body)
                var eod = transform_eod(JSON.parse(item.body))
                //seneca.make$('eod', eod).save$(after_save)
                save_to_db(eod)
            })
            cb(null, {
                success: true,
                download_count : data.length
            })
        }).catch((err) => {
            cb(err);
        });
    }
    //============== converts downloaded message to consumable format ======
    function transform_eod(raw) {
        // note: quandl specific conversion
        var columns = ['date', 'open', 'high', 'low', 'last', 'close', 'volume', 'turnover'];
        var data = raw.dataset.data[0].reduce(function(result, field, index) {
            result[columns[index]] = field;
            return result;
        }, {});
        // add extra fields
        data.timestamp = (new Date(data.date)).toISOString()
        data.tradingsymbol = raw.dataset.dataset_code
        // note: kite specific conversion
        // var columns = ['timestamp', 'open', 'high', 'low', 'close', 'volume'];
        // var data = mock_dt.data.candles[0].reduce(function(result, field, index) {
        //  result[columns[index]] = field;
        //  return result;
        // }, {});
        return data
    }
    //============== saves eod data to db
    function save_to_db(value) {
        var eod = seneca.make$('eod')
        var extend = seneca.util.deepextend
        var eod_list$ = Promise.promisify(eod.list$, {
            context: eod
        })
        eod_list$({
            tradingsymbol: value.tradingsymbol
        }).then(function(list) {
            if ((list.length > 1)) throw new Error("ERR:COLLECTION_COUNT_MISMATCH")
            if (list.length === 1) {
                var item = list[0];
                item = extend(item, value)
                item.save$(after_save)
            } else {
                var new_eod = seneca.make$('eod', value)
                new_eod.save$(after_save)
            }
        })
    }

    function after_save(err, val) {
        if (err) console.log(err);
        console.log('eod data saved:', val.tradingsymbol)
    }
}
module.exports = eod