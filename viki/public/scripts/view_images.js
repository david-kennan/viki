debug.log('loaded view_images.js');

require(["dojo/store/JsonRest", "dojo/dom", "dojo/dom-geometry", "dijit/registry", "dojo/dom-style"], function(JsonRest, dom, domGeom, registry, domStyle) {
on(aElem, "click", function() {
        var domElement;
        console.log('click handler called');
        var container = dom.byId('imageContainer');
        var imageElem = domConstruct.create("img", {src: '/image/get/' + image.dataid, width: "1px", height: "1px"}, container);
        
        on(imageElem, "load", function() { // binding to the load event may not work in all browsers, it is not in the W3C specs
            /*var imgSize = domGeom.getContentBox(imageElem);
            console.log(imgSize);
            var overlay = dom.byId('imageOverlay');
            domStyle.set(overlay, "display", "block");
            baseFx.animateProperty({
                node: overlay,
                properties: {opacity: {start:0, end: 100}},
                duration: 6500,
            }).play();*/
            
        });
        
    });
});

"dojo/dom-style"
"dojo/dom-construct"
"dojo/dom"
"dojo/dom-geometry"