define(["dojo/_base/declare", "dojo/store/JsonRest", "dojo/dom", "dojo/dom-geometry", "dijit/registry", "dojox/mobile/ScrollableView", "dojox/mobile/ContentPane", "dojo/dom-construct", "dojo/dom-style", "dojo/_base/fx", "dojo/json", "dojo/on", "dojo/window", "dojo/request"],
    function(declare, JsonRest, dom, domGeom, registry, ScrollableView, ContentPane, domConstruct, domStyle, baseFx, JSON, on, win, request) {
      return declare("viki.scrollableImageView", [ScrollableView], {
        // this is now the new widget context
        clickHandler: function(image) {
          debug.log("image clicked: " + image);
            //var container = dom.byId('imageContainer');
            var thumbnailView = dom.byId(image);
            var overlay = dom.byId('imageOverlay');
            domStyle.set(overlay, "height", win.getBox().h + "px"); // this is needed to properly size the view in iOS
            var thumbnailBox = domGeom.getMarginBox(thumbnailView);
            var imageElem = domConstruct.create("img", {src: '/image/get/' + image}, overlay);
            var closeButton = dom.byId("closeButton");
            on(imageElem, "load", function() { // binding to the load event may not work in all browsers, it is not in the W3C specs
                domStyle.set(overlay, "display", "block");
                var fullImgDim = domGeom.getMarginBox(imageElem);
                var imgRatio = fullImgDim.w / fullImgDim.h;
                var divSize = domGeom.getMarginBox(overlay);
                var dispRatio = divSize.w / divSize.h;
                var animProps = {};
                domStyle.set(imageElem, "left", (thumbnailBox.l + 50) + "px");
                domStyle.set(imageElem, "top", (thumbnailBox.t + 50 + 44) + "px");
                var buttonsHeight = domGeom.getMarginBox(closeButton).h;
                // this if/else statement sets properties that center the image
                if (imgRatio > dispRatio) {
                    animProps.width = divSize.w;
                    animProps.left = 0;
                    animProps.top = (divSize.h - divSize.w / imgRatio) / 2;
                    // need to account for case when animProps.top < buttonsHeight
                    domStyle.set(imageElem, "height", "auto");
                    domStyle.set(imageElem, "width", 0);
                }
                else {
                    divSize.h -= buttonsHeight;
                    animProps.height = divSize.h;
                    animProps.top = buttonsHeight;
                    animProps.left = (divSize.w - divSize.h * imgRatio) / 2;
                    domStyle.set(imageElem, "width", "auto");
                    domStyle.set(imageElem, "height", 0);
                }
                baseFx.animateProperty({
                    node: overlay,
                    properties: {opacity: 1},
                    duration: 500
                }).play();
                baseFx.animateProperty({
                    node: imageElem,
                    properties: animProps,
                    duration: 500
                }).play();
            });
            on(closeButton, "click", function() {
                var fadeAnim = baseFx.animateProperty({
                    node: overlay,
                    properties: {opacity: 0},
                    duration: 500
                }).play();
                baseFx.animateProperty({
                    node: imageElem,
                    properties: {height: 0, width: 0, left: thumbnailBox.l + 50, top: thumbnailBox.t + 50 + 44},
                    duration: 500
                }).play();
                on(fadeAnim, "End", function() {
                    domConstruct.destroy(imageElem);
                    domStyle.set(overlay, "display", "none");
                });
            });
            var likeButton = registry.byId("likeButton");
            likeButton.set('disabled', false);
            on(likeButton, "click", function() {
                console.log("likeButton clicked");
                request("/image/like/" + image).then(
                    function(text) {
                        console.log(text);
                        likeButton.set('disabled', true);
                    },
                    function(error) {
                        console.log(error);
                    }
                );
            });
        },
        startup: function() {
          debug.log("viki.scrollableImageView init...");
          var handler = this.clickHandler;
          var imgDispInfo = this.numVisibleImages();
          var numImages = imgDispInfo.number * 2;  // get two pages at a time
          var pagesDisplayed = 0;
          var imageDiv = dom.byId(this.containerNode); // this inserts elements directly into the pane
          this.addChild(new ContentPane({href: this.source}));

          var imageWidth = imgDispInfo.imageDim - 6;

          var imageStore = new JsonRest({target: this.source});
          
          this.getPage =  function() {
            var images = imageStore.query({type:'JSON', topic:'Outdoors', pageSize: numImages, pagesViewed:pagesDisplayed}).map(function(image) {
            var aElem = domConstruct.create("a", {cursor:'pointer'}, imageDiv);
            domConstruct.create("img", {src: '/image/get/' + image.thumbnailid, height: imageWidth, width: imageWidth, id: image.dataid, 
                                        onclick: function(){handler(this.id)}  }, aElem);
            return 0;
            });
            pagesDisplayed++;
            return images;
          }

          // get the first set of images, showing a message if there are no images
          this.getPage().then(function(d){
            if (!d.length) {
              imageDiv.innerHTML = "There are no images in " + appName + ", use the upload tab to add images.";
            }
          });

          this.inherited(arguments);
        },
        numVisibleImages: function() {
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
            this.getPage();
            debug.log("bottom reached, got more content...")
          }
        }
        // end widget
      });
    });
