debug.log('loaded view_images.js');
require(["dojo/dom", "dojo/request", "dojo/_base/array", "dojo/dom-construct"], function (dom, request, array, domConstruct) {
        request.get('/image/view/all?type=JSON&topic=Outdoors', {handleAs:"json"}).then(function(imagejson) {
            array.forEach(imagejson, function(image, index) {
                var imageDiv = dom.byId('imageCollection');
                var imageHTML = "<a href='/image/get/" + image.dataid + "'><img src='/image/get/" + image.thumbnailid + "'><\/img><\/a>";
                imageDiv.innerHTML += imageHTML;
            });
    });
});