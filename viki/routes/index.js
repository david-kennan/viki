var mongo = require('mongodb');
var mongoose = require('mongoose');
var Image = mongoose.model('Image', require('../models/image.js'));
var Fs = require('fs');
var Grid = mongo.Grid;

/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Viki: Visual Wiki' });
};

exports.upload = function(req, res) {
    res.render('upload', {title: 'Upload an image'});
};

exports.uploadImage = function(req, res) {
    var grid = new Grid(mongoose.connection.db);
    Fs.readFile(req.files.filedata.path, function(err, data) {
        grid.put(data, {metadata:{category:'image'}, content_type: 'image/jpeg', name:'imagefile'}, function(err, fileInfo) {
            var newImg = new Image({name:req.body.imagename, dataid:fileInfo._id, dateCreated: new Date()});
            newImg.save();
            res.redirect('/');
        });
    });
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
             console.log(err);
        res.writeHead(200, {'content-type':'image/jpeg'});
        res.end(data, 'binary');
    });
};
