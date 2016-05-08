
var hist = require('./lib/hist.js');

var opts = {};

module.exports = function (options) {

  var seneca = this
  var extend = seneca.util.deepextend
  opts = extend(opts, options)


  seneca.add('role:data,cmd:query,list:false', opts, hist.single)
  //seneca.add('role:info,req:part', aliasGet)
  return {
    name: 'data'
  }


}

