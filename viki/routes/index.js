
var mongoose = require('mongoose');
var Image = mongoose.model('Image', require('../models/image.js'));

/*
 * GET home page.
 */

exports.index = function(req, res){
    var testImage = new Image({name:'test1', dateCreated: new Date(), data:'this is data'});
    testImage.save();
  res.render('index', { title: 'Express' });
};