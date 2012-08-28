debug.log('loaded view_images.js');

require(["dojo/store/JsonRest", "dojo/dom", "dojo/dom-geometry", "dijit/registry"], function(JsonRest, dom, domGeom, registry) {
/*on(aElem, "click", function() {
        console.log('click handler called');
        var container = dom.byId('imageContainer');
        var imageElem = domConstruct.create("img", {src: '/image/get/' + image.dataid}, container);
        on(imageElem, "load", function() { // binding to the load event may not work in all browsers, it is not in the W3C specs
            var imgSize = domGeom.getContentBox(imageElem);
            console.log(imgSize);
            var overlay = dom.byId('imageOverlay');
            domStyle.set(overlay, "display", "block");
            baseFx.animateProperty({
                node: overlay,
                properties: {opacity: {start:0, end: 100}},
                duration: 6500,
            }).play();
        });
        
    });*/
});
