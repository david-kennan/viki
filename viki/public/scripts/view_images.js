debug.log('loaded view_images.js');

require(["dojo/store/JsonRest", "dojo/dom", "dojo/dom-geometry", "dijit/registry", "dojo/dom-construct", "dojo/dom-style", "dojo/on", "dojo/_base/fx"], function(JsonRest, dom, domGeom, registry, domConstruct, domStyle, on, baseFx, dojoHTML) {
  // todo wrap this all in a scrollable view inheriting class
  function numVisibleImages() {
    var dims = domGeom.getContentBox(dom.byId("welcome"));
    var imagesWide = Math.floor(dims.w / 106);
    var imagesHigh = Math.floor(dims.h / 106);
    return {number: imagesWide * imagesHigh, imageDim: dims.w / imagesWide};
  }
  var imgDispInfo = numVisibleImages();
  var numImages = imgDispInfo.number * 2;  // get two pages at a time
  var pagesDisplayed = 0;
  var imageDiv = dom.byId('imageCollection');
  var imageWidth = imgDispInfo.imageDim - 6;

  // To do: show message if there are no images

  var imageStore = new JsonRest({target:'/image/view/all'});
  function getPage() {
    var images = imageStore.query({type:'JSON', topic:'Outdoors', pageSize: numImages, pagesViewed:pagesDisplayed}).map(function(image) {
    var aElem = domConstruct.create("a", {cursor:'pointer'}, imageDiv);
    domConstruct.create("img", {src: '/image/get/' + image.thumbnailid, height: imageWidth, width: imageWidth}, aElem);
    
    on(aElem, "click", function() {
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
        
    });
    return 0;
    });
    pagesDisplayed++;
    return images;
  }

  // get the first set of images, showing a message if there are no images
  getPage().then(function(d){
    if (!d.length) {
      imageDiv.innerHTML = "There are no images in " + appName + ", use the upload tab to add images.";
    }
  });

  // override the scroll adjust function to watch for scroll events
  registry.byId("viewimages").adjustDestination = function (to, pos) {
    var dim = this.getDim();
    var ch = dim.c.h;
    var dh = dim.d.h;
    if (to.y < dh - ch) {
      getPage();
    }
  };
});
