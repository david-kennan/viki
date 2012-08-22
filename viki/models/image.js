var mongoose = require('mongoose');

var imageSchema = new mongoose.Schema({
    dataid: String,
    thumbnailid: String,
    name: String,
    dateCreated: Date,
});

var Image = mongoose.model('Image', imageSchema);
module.exports.Image = Image;