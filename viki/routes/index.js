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
        grid.put(data, {metadata:{category:'image'}, content_type: 'image/jpeg'}, function(err, fileInfo) {
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
    var Server = mongo.Server,
    Db = mongo.Db,
    ObjectID = mongo.ObjectID;
    
    var server = new Server('localhost', 27017, {auto_reconnect: true});
    var db = new Db('viki_dev', server);
    
    db.open(function(err, db) {
        var grid = new Grid(db, 'fs');
        grid.get(ObjectID.createFromHexString(req.params.imageID), function(err, data) {
            res.writeHead(200, {'content-type':'image/jpeg'});
            res.end(data, 'binary');
            db.close();
        });
    });
};
