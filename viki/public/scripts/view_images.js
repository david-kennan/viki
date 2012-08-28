debug.log('loaded view_images.js');

require(["dojo/dom", "dojo/dom-geometry", "dojo/dom-style", "dojo/dom-construct", "dojo/_base/fx"], function(dom, domGeom, domStyle, domConstruct, baseFx) {
    var view = registry.byId('viewimages');
    view.clickhandler = function (image) {
        console.log(image);
        //var container = dom.byId('imageContainer');
        var thumbnailView = dom.byId(image);
        var overlay = dom.byId('imageOverlay');
        var thumbnailStyle = domStyle.getComputedStyle(thumbnailView);
        var thumbnailBox = domGeom.getContentBox(thumbnailView, thumbnailStyle);
        console.log("Thumbnail contentBox is: " + thumbnailBox);
        var imageElem = domConstruct.create("img", {src: '/image/get/' + image /*, width: "1px", height: "1px", left: thumbnailBox.l + 50, top: thumbnailBox.t + 50*/}, overlay);
        on(imageElem, "load", function() { // binding to the load event may not work in all browsers, it is not in the W3C specs
            var fullImgStyle = domStyle.getComputedStyle(imageElem);
            var fullImgDim = domGeom.getContentBox(imageElem);
            console.log("Full image contentBox is: " + fullImgDim);
            baseFx.animateProperty({
                node: overlay,
                properties: {opacity: {start:0, end: 100}},
                duration: 1000
            }).play();
            baseFx.animateProperty({
                node: imageElem,
                properties: {},
                duration: 1000
            });
        });
    };
});