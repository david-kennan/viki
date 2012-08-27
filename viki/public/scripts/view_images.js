debug.log('loaded view_images.js');
require(["dojo/store/JsonRest", "dojo/dom", "dojo/dom-geometry", "dijit/registry"], function(JsonRest, dom, domGeom, registry) {
    function numVisibleImages() {
        var dims = domGeom.getContentBox(dom.byId("welcome"));
        var imagesWide = Math.floor(dims.w / 106);
        var imagesHigh = Math.floor(dims.h / 106);
        return {number: imagesWide * imagesHigh, imageDim: dims.w / imagesWide};
    }
    var imgDispInfo = numVisibleImages();
    var numImages = imgDispInfo.number * 2;
    var pagesDisplayed = 0;
    var imageDiv = dom.byId('imageCollection');
    var imageWidth = imgDispInfo.imageDim - 6;
    // To do: show message if there are no images
    var imageStore = new JsonRest({target:'/image/view/all'});
    function getPage() {
        var images = imageStore.query({type:'JSON', topic:'Outdoors', pageSize: numImages, pagesViewed:pagesDisplayed});
        images.map(function(image) {
                   var imageHTML = "<a href='/image/get/" + image.dataid + "'><img src='/image/get/" + image.thumbnailid + "' height=" + imageWidth + "width=" + imageWidth + "></img></a>";
                   imageDiv.innerHTML += imageHTML;
        });
        pagesDisplayed++;
    }
    getPage();
    registry.byId("viewimages").adjustDestination = function (to, pos) {
        var dim = this.getDim();
        var ch = dim.c.h;
        var dh = dim.d.h;
        if (to.y < dh - ch) {
        console.log('reached end');
        getPage();
        }
    };
});