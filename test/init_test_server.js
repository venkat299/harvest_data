var path = require('path')
var fs = require('fs')
var mkdirp = require('mkdirp')
var config = require('../config.json')
    // ======= change db here =========
var test_db = config.test.current_db
    // ================================
var test_db_name = config.test[test_db].db_type
var test_db_config = config.test[test_db].db_config
    // ###### testing module ########

function start(cb) {
    var seneca = require('seneca')();
    var Promise = require('bluebird')
        //Promise.promisify(seneca.make$,{context:seneca})
        //Promise.promisify(seneca.list$,{context:seneca})
        // ###### service needed for testing  ########
        //var harvest_strategy = require('harvest_strategy');
        // var harvest_data = require('harvest_data');
        // var harvest_evaluator = require('harvest_evaluator');
        // var harvest_executor = require('harvest_executor');
        // seneca.use(harvest_data)
        // 	//seneca.use(harvest_strategy)
        // seneca.use(harvest_evaluator)
        // seneca.use(harvest_executor)
        // ###### current service being tested ########
    seneca.use('../index.js')
    // ###### resetting db  ########
    reset_db()
    // ###### adding test db  ########
    try {
        seneca.use('entity')
        seneca.use(test_db_name, test_db_config)
    } catch (err) {
        console.log(err)
    }
    // ###### promisifying method act  ########
    Promise.promisify(seneca.act, {
        context: seneca
    })
    // ###### returning a promise that db is configured  ########
    return new Promise(function(resolve, reject) {
        seneca.ready(function() {
            // seneca.add('role:test_server,cmd:check_status', function(opt, cb) {
            // 	cb(null, {
            // 		success: true,
            // 		server: 'alive',
            // 		server_type: 'test'
            // 	})
            // })
            try {
                seneca.listen({
                    host: 'localhost',
                    port: '8080'
                })
                resolve(seneca)
            } catch (e) {
                reject(e)
            }
            //console.log('test server listening')
        })
    })
}
var reset_db = function() {
    // ###### for mongo db  ########
    if (test_db === 'mongo') {
        // drop mongo db
        //console.log('clearing mongodb database')
    }
    // ###### for level db and json-file db  ########
    else {
        // ######### removing db directories #########
        //console.log('clearing db files')
        rmDir(test_db_config.folder, false)
        rmDir('server/python_node_ipc/', false)
        // ######### creating empty db directory #########
        var mkdirp = require('mkdirp');
        mkdirp(test_db_config.folder, function(err) {
            // path exists unless there was an error
            if (err) throw err
                // work around for race issue while saving eod in eod.js
            mkdirp(test_db_config.folder + '/eod')
        });
    }
}
var rmDir = function(dirPath, removeSelf) {
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
module.exports.start = start