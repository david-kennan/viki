var mongoose = require('mongoose');

var imageSchema = new mongoose.Schema({
    dataid: String,
    thumbnailid: String,
    name: String,
    dateCreated: Date,
    topicid: String, // should be a list
    votes: Number
});

imageSchema.methods.like = function () {
    this.votes++;
    this.save();
};

var Image = mongoose.model('Image', imageSchema);
module.exports.Image = Image;