var mongoose = require('mongoose');

var topicSchema = new mongoose.Schema({
    name: String,
    description: String,
    category: String
});

var Topic = mongoose.model('Topic', topicSchema);
module.exports.Topic = Topic;