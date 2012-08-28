define(["dojo/_base/declare", "dojo/store/JsonRest", "dojo/dom", "dojo/dom-geometry", "dijit/registry", "dojox/mobile/ScrollableView", 
    "dojox/mobile/ContentPane"], 
    function(declare, JsonRest, dom, domGeom, registry, ScrollableView, ContentPane) {
      return declare("viki.scrollableImageView", [ScrollableView], {
        // this is now the new widget context
        startup: function() {
          debug.log("viki.scrollableImageView init...");

          var imgDispInfo = this.numVisibleImages();
          var numImages = imgDispInfo.number * 2;  // get two pages at a time
          var pagesDisplayed = 0;
          var imageDiv = dom.byId(this.containerNode); // this inserts elements directly into the pane
          this.addChild(new ContentPane({href: this.source}));

          var imageWidth = imgDispInfo.imageDim - 6;

          var imageStore = new JsonRest({target: this.source});
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

          this.inherited(arguments);
        },
        numVisibleImages: function () {
          var dims = domGeom.getContentBox(dom.byId("welcome"));  // BAD!!! - fix this by not referencing a dom element by name
          var imagesWide = Math.floor(dims.w / 106);
          var imagesHigh = Math.floor(dims.h / 106);
          return {number: imagesWide * imagesHigh, imageDim: dims.w / imagesWide};
        },
        adjustDestination:  function (to, pos) {
          var dim = this.getDim();
          var ch = dim.c.h;
          var dh = dim.d.h;
          if (to.y < dh - ch) {
            //getPage();
            debug.log("reached bottom of content")
          }
        }
        // end widget
      });
    });
