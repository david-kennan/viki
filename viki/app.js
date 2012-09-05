// This is the node entry point for the viki app
// 8/2012, Sam Greene & Ziv Kennan

// config mongo server
var mongo_server = 'localhost';
var mongo_port = '27017';
var mongo_db = 'viki_dev';

// dependencies
var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , mongoose = require('mongoose');

// initialize express, mongoose
var app = express();
mongoose.connect('mongodb://'+mongo_server+':'+mongo_port+'/'+mongo_db);

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('3489234dkslfjf93ddw90092'));
  app.use(express.session());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

// special config for development
app.configure('development', function(){
  console.log("Running in development mode...");
  app.use(express.errorHandler());
  app.locals.pretty = true;
});

app.configure('production', function(){
  console.log("Running in production mode...");
});

// route
app.get('/', routes.index);                         // home page
app.get('/image/upload', routes.upload);            // upload an image
app.get('/image/view/all', routes.viewimages);      // view images
app.get('/image/get/:imageID', routes.getImage);    // get a specific image
app.post('/image/upload', routes.uploadImage);      // upload an image
app.get('/image/like/:imageID', routes.likeImage);  // like an image
app.get('/image/tag/:imageID', routes.getTags);     // get image tags
app.post('/image/tag/:imageID', routes.tagImage);   // tag an image
app.get('/topic/all', routes.getTopics);           // get all topics

// listen
http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
  console.log ("Viki is ready...");
});
