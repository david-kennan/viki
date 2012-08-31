var mongoose = require('mongoose');

var tagSchema = new mongoose.Schema({
    x: Number,
    y: Number,
    width: Number,
    height: Number,
    imageId: String,
    topicId: String
});

var Tag = mongoose.model('Tag', tagSchema);
module.exports.Tag = Tag;