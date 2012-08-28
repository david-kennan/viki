debug.log('loaded view_images.js');

require(["dojo/store/JsonRest", "dojo/dom", "dojo/dom-geometry", "dijit/registry"], function(JsonRest, dom, domGeom, registry) {
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

  var imageStore = new JsonRest({target:'/image/view/all'});
  function getPage() {
    var images = imageStore.query({type:'JSON', topic:'Outdoors', pageSize: numImages, pagesViewed:pagesDisplayed}).map(function(image) {
      var imageHTML = "<a href='/image/get/" + image.dataid + "'><img src='/image/get/" + image.thumbnailid 
      + "' height=" + imageWidth + "width=" + imageWidth + "></img></a>";
    imageDiv.innerHTML += imageHTML;
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
