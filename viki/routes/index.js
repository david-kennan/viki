var mongo = require('mongodb');
var mongoose = require('mongoose');
var Image = mongoose.model('Image', require('../models/image.js'));
var Fs = require('fs');
var Grid = mongo.Grid;
var thumbnailSize = 100;

/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Welcome' });
};

exports.upload = function(req, res) {
    res.render('upload', {title: 'Upload an image'});
};

exports.uploadImage = function(req, res) {
  if (req.files.filedata.length != 0) {
    
    // Image processing
    var gm = require('gm');
    var original = gm(req.files.filedata.path);
    original.interlace('Line');
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
                    var minDimension = landscape ? value.height : value.width;
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
                                var newImg = new Image({name:req.body.imagename, dataid:origInfo._id, thumbnailid: thumbInfo._id, dateCreated: new Date()});
                                newImg.save();
                                res.redirect('/');
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
    res.end("No file supplied for upload");
  }
}

exports.viewimages = function (req, res) {
    Image.find(function (err, images) {
      res.render('view_images', {title: 'All Images', images: images});
    });
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
