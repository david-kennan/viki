var mongo = require('mongodb');
var mongoose = require('mongoose');
var Image = mongoose.model('Image', require('../models/image.js'));
var Topic = mongoose.model('Topic', require('../models/topic.js'));
var Tag = mongoose.model('Tag', require('../models/tag.js'));
var Fs = require('fs');
var Grid = mongo.Grid;
var thumbnailSize = 200;  // H x W dimension in pixels; note: this also must be changed in index.jade.  now it is hardcoded.  fix this

// be sure to set dev false after development is complete
exports.index = function(req, res){
  // detect iOS and disable upload for now, will add back once supported in iOS
  var ua = req.headers['user-agent'];
  var isIOS = /iPad/i.test(ua) || /iPhone/i.test(ua);
  var isAndroid = /Android/i.test(ua);
  res.render('index', { appname: 'Visual Wiki', dev: true, isIOS: isIOS, isAndroid: isAndroid });
};

exports.upload = function(req, res) {
  res.render('upload');
};

exports.uploadImage = function(req, res) {
  if(req.xhr) {
    res.json(400,{success: false, reason: "invalid_upload_method_attempted"});
    return; // just in case
  }
  if (req.files.qqfile.length != 0) {
    // Image processing
    var path = req.files.qqfile.path;
    var util = require('util');
    var exec = require('child_process').exec;
    exec('file -b --mime-type ' + path, function(error, stdout, stderr) {
      if (!(stdout == 'image/jpeg\n' || stdout == 'image/png\n' || stdout == 'image/tiff\n' || stdout == 'image/tif\n' || stdout == 'image/x-tif\n' || stdout == 'image/x-tiff\n' || stdout == 'image/bmp\n' || stdout == 'image/x-bmp\n' || stdout == 'image/x-bitmap\n' || stdout == 'image/x-xbitmap\n' || stdout == 'image/x-win-bitmap\n' || stdout == 'image/x-windows-bitmap\n' || stdout == 'image/ms-bmp\n' || stdout == 'image/x-ms-bmp\n')) {
        res.send(JSON.stringify({
          success: false, 
          reason: "invalid_file_type_error",
          detail: stdout
        }), {'Content-Type': 'text/plain'}, 400);
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
                if (maxDimension > 100) {
                    var resizeFactor = minDimension/thumbnailSize;
                    original.resize(value.width/resizeFactor, value.height/resizeFactor);
                    var cropX = landscape ? (value.width/resizeFactor - thumbnailSize) / 2 : 0;
                    var cropY = landscape ? 0 : (value.height/resizeFactor - thumbnailSize) / 2;
                    original.crop(thumbnailSize, thumbnailSize, cropX, cropY);
                }
                original.stream(function(err, stdout, stderr) {
                  var thumbArray = [];
                  stdout.on('data', function(data) {
                    thumbArray.push(data);
                  });
                  stdout.on('close', function() {
                    var thumbImage = Buffer.concat(thumbArray);
                    grid.put(thumbImage, {metadata:{category:'image'}, content_type: 'image/jpeg'}, function(err, thumbInfo) {
                      if (err) console.log(err);
                      Topic.find({name: req.param('imagetopic')}, function(err, topics) {
                        var imageTopic;
                        if (topics.length > 1) {
                          res.send(JSON.stringify({
                            success: false, 
                            reason: "multiple_topic_error",
                            detail: req.param('imagetopic')
                          }), {'Content-Type': 'text/plain'}, 400);
                          return;
                        }
                        else if (topics.length == 0) {
                          imageTopic = new Topic({name:req.param('imagetopic'), description: 'A description of this topic'});
                          imageTopic.save();
                        }
                        else {
                          imageTopic = topics[0];
                        }
                      var newImg = new Image({name:req.param('imagename'), dataid:origInfo._id, thumbnailid: thumbInfo._id, dateCreated: new Date(), topicid: imageTopic._id, votes: 0});
                      newImg.save();
                      res.send(JSON.stringify({success: true}), {'Content-Type': 'text/plain'}, 200);
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
    res.json(400, {success: false, reason: "no_file_provided_error"});
  }
}

exports.viewimages = function (req, res) {
  var query = req.query;
  if (query.type == "JSON") {
    if (query.topic) {
      Topic.find({name: query.topic}, function (err, topics) {
        // for development only //
        if (topics.length == 0) {
          var tmptopic = new Topic({name: 'Outdoors', description: 'Outdoor Images', category: 'Nature'});
          tmptopic.save();
          res.json(200, {});
        }
        // delete after dev //
        else if (topics.length > 1) {
          res.json(500, {success: false, reason: "duplicate_topic_error", detail: req.query.topic});
        }
        else {
          Image.find({topicid: topics[0]._id}, {}, {skip:query.itemsViewed, limit:query.pageSize}).sort('-votes').exec(function (err, images) {
            res.json(200, images);
          });
        }
      });
    }
  }
  else {
    res.render('view_images')
  }
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

exports.likeImage = function (req, res) {
    var id = req.params.imageID;
    Image.find({dataid: id}, function(err, images) {
        if (images.length == 0) {
            res.json(500, {success: false, reason: "image_not_found_error", detail: id});
        }
        else if (images.length > 1) {
            res.json(500, {success: false, reason: "duplicate_image_error", detail: id});
        }
        else {
            images[0].like();
            res.json(200, {success: true, votes: images[0].votes});
        }
    });
};

exports.tagImage = function (req, res) {
    var id = req.params.imageID;
    Image.find({dataid: id}, function (err, images) {
        if (images.length == 0) {
            res.json(500, {success: false, reason: "images_not_found_error"});
        }
        else if (images.length > 1) {
            res.json(500, {success: false, reason: "multiple_images_found_error"});
        }
        else {
            Topic.find({name: req.body.topic}, function(err, topics) {
                if (topics.length == 0) {
                  res.json(500, {success: false, reason: "no_topics_found_error"});
                }
                else if (topics.length > 1) {
                    res.json(500, {success: false, reason: "multiple_topics_found_error"});
                }
                else {
                    var tag = new Tag({x: req.body.x, y: req.body.y, width: req.body.width, height: req.body.height, imageId: images[0]._id, topicId: topics[0]._id});
                    tag.save();
                    res.json(200, {success: true});
                }
            });
        }
    });
};

exports.getTags = function (req, res) {
    var id = req.params.imageID;
    Image.find({dataid: id}, function (err, images) {
        if (images.length == 0) {
            res.json(500, {success: false, reason: "image_not_found_error", detail: id});
        }
        else if (images.length > 1) {
            res.json(500, {success: false, reason: "multiple_images_found_error", detail: id});
        }
        else {
            Tag.find({imageId: images[0]._id}, function(err, tags) {
                res.json(200,  tags);
            });
        }
    });
};

exports.getTopics = function (req, res) {
  Topic.find({}, function (err, topics) {
    res.json(200, topics);   
  });
}

exports.newTopic = function (req, res) {
  Topic.find({name: req.params.topicName}, function (err, topic) {
    if (topic.length == 0) {
      topic = new Topic({name:req.params.topicName, description: req.query.description});
      topic.save();
      res.json(200, {success: true, newtopic: topic.name});
    } else {
      res.json(400, {success: false, reason: "duplicate_topic"});
    }
  });
}

exports.deleteImage = function (req, res) {
  Image.find({dataid: req.params.imageID}, function (err, images) {
    if (images.length == 0) {
      res.json(500, {success: false, reason: "image_not_found_error"});
    }
    else if (images.length > 1) {
      res.json(500, {success: false, reason: "multiple_images_found_error"});
    }
    else {
      // delete image & thumbnail in gridfs
      var grid = new Grid(mongoose.connection.db);
      grid.delete(mongo.ObjectID.createFromHexString(images[0].dataid), function(err, result) {
        if (!err) { console.log("Deleted image with id "+images[0].dataid); } 
        else { 
          console.log(err) 
          res.json(500, {success: false});
        }
      });
      grid.delete(mongo.ObjectID.createFromHexString(images[0].thumbnailid), function(err, result) {
        if (!err) { console.log("Deleted image thumbnail with id "+images[0].thumbnailid); } 
        else { 
          console.log(err) 
          res.json(500, {success: false});
        }
      });
      // delete any tags
      Tag.remove({imageId: images[0]._id}, function (err) {
        if (err) { console.log(err); }
      });
      // delete the image record
      Image.remove({dataid: req.params.imageID}, function(err) {
        if (err) {
          console.log(err);
          res.json(500, {success: false});
        }
      });
      res.json(200, {success: true});
    }
  });
}
