
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , mongoose = require('mongoose');

// Initializations
var app = express();
/*var db = mongoose.createConnection('localhost', 'viki_dev');
db.on('error', console.error.bind(console, 'connection error:'));
db.on('open', console.info.bind(console, 'mongoose connected successfully'));
var Image = require('./models/image.js').Image(db);*/

mongoose.connect('mongodb://localhost:27017/viki_dev');
//mongoose.model('Image', require('./models/image.js').Image);

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('your secret here'));
  app.use(express.session());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
