var mongo = require('mongodb');
var mongoose = require('mongoose');
var Image = mongoose.model('Image', require('../models/image.js'));
var Fs = require('fs');
var Grid = mongo.Grid;
var thumbnailSize = 100;  // H x W dimension in pixels

/*
 * GET home page.
 */

// be sure to set dev false after development is complete
exports.index = function(req, res){
  res.render('index', { title: 'Welcome', dev: true });
};

exports.upload = function(req, res) {
    res.render('upload', {title: 'Upload an image'});
};

exports.uploadImage = function(req, res) {
  if (req.files.filedata.length != 0) {
    // Image processing
    var path = req.files.filedata.path;
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
                                res.redirect('/');
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
                                        var newImg = new Image({name:req.body.imagename, dataid:origInfo._id, thumbnailid: thumbInfo._id, dateCreated: new Date(), topic: 'Outdoors'});
                                        newImg.save();
                                        res.redirect('/');
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
    res.end("<center><h2>No file supplied for upload, that's an error. You shouldn't be seeing this, so either you're a nefarious user, or there's actually something wrong - we'll look into it. <a href='/'>Go Back</a></h3></center>");
  }
}

exports.viewimages = function (req, res) {
    Image.find({topic: "Outdoors"}, function (err, images) {
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
