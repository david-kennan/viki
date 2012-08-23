debug.log('loaded view_images.js');
require(["dojo/dom", "dojo/request", "dojo/_base/array", "dojo/dom-construct"], function (dom, request, array, domConstruct, parser) {
  request.get('/image/view/all?type=JSON&topic=Outdoors', {handleAs:"json"}).then(function(imagejson) {
    var imageDiv = dom.byId('imageCollection');
    if(imagejson.length != 0) {
      array.forEach(imagejson, function(image, index) {
        var imageHTML = "<a href='/image/get/" + image.dataid + "'><img src='/image/get/" + image.thumbnailid + "'></img></a>";
        imageDiv.innerHTML += imageHTML;
      });
    }
    else {
        imageDiv.innerHTML = "There aren't any images in viki, if you'd like to upload one use the upload pane below...";
    }
  });
});
