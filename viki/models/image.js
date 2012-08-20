var mongoose = require('mongoose');



var imageSchema = new mongoose.Schema({
    data: String,
    name: String,
    dateCreated: Date,
});

/*exports.Image = function (db) {
    console.log(db.model);
    return db.model('Image');
}*/

var Image = mongoose.model('Image', imageSchema);
module.exports.Image = Image;