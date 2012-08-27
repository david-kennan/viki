var mongo = require('mongodb');
var mongoose = require('mongoose');
var Image = mongoose.model('Image', require('../models/image.js'));
var Topic = mongoose.model('Topic', require('../models/topic.js'));
var Fs = require('fs');
var Grid = mongo.Grid;
var thumbnailSize = 100;  // H x W dimension in pixels

// be sure to set dev false after development is complete
exports.index = function(req, res){
  res.render('index', { appname: 'Visual Wiki', dev: true });
};

exports.upload = function(req, res) {
  res.render('upload');
};

exports.uploadImage = function(req, res) {
  if (req.files.filedata.length != 0) {
    // Image processing
    var path = req.files.filedata.path;
    console.log(path);
    var util = require('util');
    var exec = require('child_process').exec;
    exec('file -b --mime-type ' + path, function(error, stdout, stderr) {
      if (!(stdout == 'image/jpeg\n' || stdout == 'image/png\n' || stdout == 'image/tiff\n' || stdout == 'image/tif\n' || stdout == 'image/x-tif\n' || stdout == 'image/x-tiff\n' || stdout == 'image/bmp\n' || stdout == 'image/x-bmp\n' || stdout == 'image/x-bitmap\n' || stdout == 'image/x-xbitmap\n' || stdout == 'image/x-win-bitmap\n' || stdout == 'image/x-windows-bitmap\n' || stdout == 'image/ms-bmp\n' || stdout == 'image/x-ms-bmp\n')) {
        res.writeHead(200);
        res.end("Invalid file type uploaded: please upload a JPEG, PNG, TIFF, or BMP image");
        return;
      }
      var gm = require('gm');
      var original = gm(path);
      original.setFormat('jpeg');
      original.interlace('Line');
      original.size(function(err, value) {
        var exceedWidth = value.width > 800;
        var exceedHeight = value.height > 600;
        if (exceedWidth || exceedHeight) {
          var widthFactor = value.width / 800;
          var heightFactor = value.height / 600;
          var overallFactor = widthFactor > heightFactor ? widthFactor : heightFactor;
          original.resize(value.width/overallFactor, value.height/overallFactor);
        }
        original.stream(function(err, stdout, stderr) {
          var dataArray = [];
          stdout.on('data', function (data) {
            dataArray.push(data);
          });
          stdout.on('close', function() {
            require('bufferjs');
            var fullImage = Buffer.concat(dataArray);
            var grid = new Grid(mongoose.connection.db);
            grid.put(fullImage, {metadata:{category:'image'}, content_type: 'image/jpeg'}, function(err, origInfo) {
              original.size(function(err, value) {
                var landscape = value.width > value.height;
                var maxDimension = landscape ? value.width : value.height;
                var minDimension = landscape ? value.height : value.width;
                if (maxDimension < 100) {
                  var newImg = new Image({name:req.body.imagename, dataid:origInfo._id, thumbnailid: null, dateCreated: new Date(), topic: 'Outdoors'});
                  newImg.save();
                  res.writeHead(200);
                  res.end();
                  return;
                }
                var resizeFactor = minDimension/thumbnailSize;
                original.resize(value.width/resizeFactor, value.height/resizeFactor);
                var cropX = landscape ? (value.width/resizeFactor - thumbnailSize) / 2 : 0;
                var cropY = landscape ? 0 : (value.height/resizeFactor - thumbnailSize) / 2;
                original.crop(thumbnailSize, thumbnailSize, cropX, cropY);
                original.stream(function(err, stdout, stderr) {
                  var thumbArray = [];
                  stdout.on('data', function(data) {
                    thumbArray.push(data);
                  });
                  stdout.on('close', function() {
                    var thumbImage = Buffer.concat(thumbArray);
                    grid.put(thumbImage, {metadata:{category:'image'}, content_type: 'image/jpeg'}, function(err, thumbInfo) {
                      if (err) console.log(err);
                      Topic.find({name: req.body.imagetopic}, function(err, topics) {
                        var imageTopic;
                        if (topics.length > 1) {
                          res.end(200, 'Error: there is more than one topic with name ' + req.body.imagetopic);
                          return;
                        }
                        else if (topics.length == 0) {
                          imageTopic = new Topic({name:req.body.imagetopic, description: 'A description of this topic'});
                          imageTopic.save();
                        }
                        else {
                          imageTopic = topics[0];
                        }
                      var newImg = new Image({name:req.body.imagename, dataid:origInfo._id, thumbnailid: thumbInfo._id, dateCreated: new Date(), topicid: imageTopic._id});
                      newImg.save();
                      res.writeHead(200);
                      res.end();
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });

  }
  else {
    res.writeHead(200);
    res.end("No file supplied for upload, that's an error. You shouldn't be seeing this, so either you're a nefarious user, or there's actually something wrong - we'll look into it.");
  }
}

exports.viewimages = function (req, res) {
  var query = req.query;
  if (query.type == "JSON") {
    if (query.topic) {
      Topic.find({name: query.topic}, function (err, topics) {
        // for developement only //
        if (topics.length == 0) {
          //var tmptopic = new Topic({name: 'Outdoors', description: 'Outdoor Images', category: 'Nature'});
          //tmptopic.save();
        }
        // delete after dev //
        else if (topics.length > 1) {
          res.writeHead(200);
          res.end('Error: more than one topic with name ' + req.query.topic + ' found');
        }
        else {
          Image.find({topicid: topics[0]._id}, {}, {skip:query.pageSize * query.pagesViewed, limit:query.pageSize}, function (err, images) {
            res.json(200, images);
          });
        }
      });
    }
  }
  else {
    res.render('view_images')
  }
  /*else {
    Image.find(function (err, images) {
    res.json(200, images);
    });
    }
    }*/
};

exports.getImage = function (req, res) {
  var ObjectID = mongo.ObjectID;

  var grid = new Grid(mongoose.connection.db);
  grid.get(ObjectID.createFromHexString(req.params.imageID), function(err, data) {
    if (err) {
      console.log(err);
    }
    res.writeHead(200, {'content-type':'image/jpeg'});
    res.end(data, 'binary');
  });
};
