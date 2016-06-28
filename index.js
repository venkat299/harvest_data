// var hist = require('./lib/hist.js');
var eod_quandl = require('./lib/download_quandl/eod.js');
var eod_nse = require('./lib/download_nse/eod.js');
var app_config = require('./config.json');
var opts = {
    "app_config": app_config
};
module.exports = function(options) {
    var seneca = this
    var extend = seneca.util.deepextend
    opts = extend(opts, options)
    // setting up eod
    switch (app_config.data_provider.current_dp_eod) {
        case 'quandl':
            seneca.use(eod_quandl, opts)
            break;
        case 'nse':
            seneca.use(eod_nse, opts)
            break;
    }
    return {
        name: 'data'
    }
}