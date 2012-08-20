
var mongoose = require('mongoose');
var Image = mongoose.model('Image', require('../models/image.js'));

/*
 * GET home page.
 */

exports.index = function(req, res){
//    var testImage = new Image({name:'test1', dateCreated: new Date(), data:'this is data'});
//    testImage.save();
  res.render('index', { title: 'Express' });
};

exports.upload = function(req, res) {
    res.render('upload', {title: 'Upload an image'});
};

exports.uploadImage = function(req, res) {
    
    var Db = require('mongodb').Db,
    Server = require('mongodb').Server,
    ReplSetServers = require('mongodb').ReplSetServers,
    ObjectID = require('mongodb').ObjectID,
    Binary = require('mongodb').Binary,
    GridStore = require('mongodb').GridStore,
    Code = require('mongodb').Code,
    BSON = require('mongodb').pure().BSON,
    assert = require('assert'),
    fs = require('fs');
    
    var db = new Db('viki_dev', new Server("127.0.0.1", 27017,
                                                    {auto_reconnect: false, poolSize: 1}), {native_parser: false});
    
    // Establish connection to db
    db.open(function(err, db) {
            // Our file ID
        var fileId = new ObjectID();
            
        // Open a new file
        var gridStore = new GridStore(db, fileId, 'w');
            
        // Read the filesize of file on disk (provide your own)
        var fileSize = fs.statSync(req.files.filedata.path).size;
        // Read the buffered data for comparision reasons
        var data = fs.readFileSync(req.files.filedata.path);
            
        // Open the new file
        gridStore.open(function(err, gridStore) {
                           
        // Write the file to gridFS
            gridStore.writeFile(req.files.filedata.path, function(err, doc) {
                GridStore.read(db, fileId, function(err, fileData) {
                    //console.log('original is ' + fileSize + ', server is ' + fileData.length);
                    //res.writeHead(200, {'content-type':'image/jpeg'});
                    //res.end(fileData, 'binary');
                    res.redirect('/');
                    db.close();
    var imagename = req.body.imagename;
                               var newImg = new Image({name:imagename, dataid:fileId, dateCreated: new Date()});
                               newImg.save();
                               
                });
            });
        });
    });
//    console.log(req.files.filedata.path);
    //    console.log(req.files.filedata.type);
    //newImg.save();
}

exports.viewimages = function (req, res) {
    var allImages;
    Image.find(function (err, images) {
        allImages = images;
    });
    res.render('view_images', {title: 'All Images', images: allImages});
};