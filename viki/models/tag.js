var mongoose = require('mongoose');

var tagSchema = new mongoose.Schema({
    x: Integer,
    y: Integer,
    width: Integer,
    height: Integer,
    link: String,
});