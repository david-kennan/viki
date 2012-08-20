var mongo = require("mongodb");
var Server = mongo.Server;
var Database = mongo.Db;

var server = new Server('localhost', 27017, {'auto-reconnect': true});
var db = new Database('test', server);

db.open(function (err, db) {
    if (!err) {
        db.collection('testc', function (err, collection) {
            collection.remove({name:'doc1'}, function(err, result) {
                console.log(result);
                var stream = collection.find({name:{$ne:1}}).streamRecords();
                stream.on('data', function(item) {
                    console.log(item);
                });
                stream.on('end', function() {
                    console.log('collection ended');
                });
            });
        });
    }
});

/*

            var doc1 = {name:2, age:20};
            collection.insert(doc1, function (err, result) {
                var docStream = collection.find({name:{$ne:1}}).streamRecords();
                docStream.on('data', function(item) {
                    console.log(item);
                });
            });
        });

*/