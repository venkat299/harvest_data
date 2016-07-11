var Promise = require('bluebird')
var fs = require('fs')
var Mimicry = require('mimicry');
var moment = require('moment')
var parse = require('csv-parse');
var unzip = require('unzip')
var path = require('path')
var mimic_browser = new Mimicry();
var request = Promise.promisifyAll(require("request"));
// =======================
// private lib
// =======================
function eod(options) {
    var seneca = this
        // the logging function, built by init
    var app_config = options.app_config
    var curr_db = app_config.test.current_db
        // place all the patterns together
        // this make it easier to see them at a glance
    this.add('role:data,comp:eod,cmd:download', download)
    //============== downloads eod data from quandl ======
    function download(opt, cb) {
        //console.log('in download', options)
        var final_cb = cb
        var symbol_list = opt.data
        var task_list = []
        var dp_name = app_config.data_provider.current_dp_eod
        var dp = app_config.data_provider
        var url = dp[dp_name].url
        var fileName = dp[dp_name].filename
        var time_now = moment().format('HH')
        var day_today = moment().format('ddd')
        var date_needed = moment()
        console.log(time_now, day_today)
        if (day_today.toUpperCase() === 'SUN') date_needed = date_needed.subtract(2, 'days');
        else if (day_today.toUpperCase() === 'SAT') date_needed = date_needed.subtract(1, 'days');
        else if (+time_now < 17)
            if (day_today.toUpperCase() === 'MON') date_needed = date_needed.subtract(3, 'days');
            else date_needed = date_needed.subtract(1, 'days');
        var yyyy = date_needed.format('YYYY')
        var mmm = date_needed.format('MMM').toUpperCase()
        var dd = date_needed.format('DD')
        url = url.replace(/@YYYY/g, yyyy).replace(/@MMM/g, mmm).replace(/@DD/g, dd)
        fileName = fileName.replace(/@YYYY/g, yyyy).replace(/@MMM/g, mmm).replace(/@DD/g, dd)
        console.log(url)
        var save_path_zip = './download/eod_' + yyyy + '_' + mmm + '_' + dd + '.csv.zip'
        var save_path_csv = './download/eod_' + yyyy + '_' + mmm + '_' + dd + '.csv'
        fs.stat(save_path_csv, function(err, stats) {
            if (err || !stats.isFile()) download_csv({ // download from NSE 
                url: url,
                save_path_zip: save_path_zip,
                save_path_csv: save_path_csv,
                fileName: fileName
            }, function(e) {
                if (e) final_cb(e)
                save_to_db(save_path_csv, final_cb)
            })
            else {
                console.log('skipping eod file download as file is already present')
                save_to_db(save_path_csv, final_cb)
            }
        })
    }

    function download_csv(opt, cb) {
        try {
            mimic_browser.get(opt.url, function(err, data) {
                fs.writeFile(opt.save_path_zip, data, function(err, written, buffer) {
                    fs.createReadStream(opt.save_path_zip).pipe(unzip.Parse()).on('entry', function(entry) {
                        var fileName = entry.path;
                        var type = entry.type; // 'Directory' or 'File' 
                        var size = entry.size;
                        if (fileName === opt.fileName) {
                            entry.pipe(fs.createWriteStream(opt.save_path_csv));
                        } else {
                            entry.autodrain();
                        }
                    }).on('close',function(){
                        cb()
                    });
                })
            });
        } catch (e) {
            cb(e)
        }
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
    function save_to_db(path, cb) {
        if (curr_db === 'json') {
            var db_path = app_config.test[curr_db].db_config.folder
            rmDir(db_path + '/eod', false)
        }
        // var eod = seneca.make$('eod')
        // var eod_list$ = Promise.promisify(eod.list$, {
        //     context: eod
        // })
        // eod_list$().then(function(ls) {
        //     ls.forEach(function(ls_item) {
        //         ls_item.remove$()
        //     })
        console.log('path:', path)
        var task_arr = []
        var parser = parse({
            columns: true
        }, function(err, data) {
            console.log('data.length:', data.length);
            data.forEach(function(item) {
                var ent = {
                    tradingsymbol: item.SYMBOL,
                    SERIES: item.SERIES,
                    open: parseFloat(item.OPEN),
                    high: parseFloat(item.HIGH),
                    low: parseFloat(item.LOW),
                    close: parseFloat(item.CLOSE),
                    last: parseFloat(item.LAST),
                    prevclose: parseFloat(item.PREVCLOSE),
                    qty: parseInt(item.TOTTRDQTY),
                    volume: parseInt(item.TOTTRDVAL),
                    timestamp: item.TIMESTAMP,
                    trades:parseInt( item.TOTALTRADES),
                    ISIN: item.ISIN
                }
                task_arr.push(new Promise(function(res, rej) {
                    seneca.make$('eod', ent).save$(function(err) {
                        if (err) rej()
                        res()
                    })
                }))
            })
            Promise.all(task_arr).then(function() {
                cb(null, {
                    success: true
                })
            }).catch(e => {
                cb(e)
            })
        })
        fs.createReadStream(path).pipe(parser);
        // })
    }

    function after_save(err, val) {
        if (err) console.log(err);
        console.log('eod data saved:', val.tradingsymbol)
    }

    function rmDir(dirPath, removeSelf) {
        if (removeSelf === undefined) removeSelf = true;
        try {
            var files = fs.readdirSync(dirPath);
        } catch (e) {
            //throw e
            return;
        }
        if (files.length > 0)
            for (var i = 0; i < files.length; i++) {
                var filePath = path.join(dirPath, files[i]);
                if (fs.statSync(filePath).isFile()) fs.unlinkSync(filePath);
                else rmDir(filePath);
            }
        if (removeSelf) fs.rmdirSync(dirPath);
    };
}
module.exports = eod