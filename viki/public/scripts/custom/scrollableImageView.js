define(["dojo/_base/declare", "dojo/store/JsonRest", "dojo/dom", "dojo/dom-geometry", "dijit/registry", "dojox/mobile/ScrollableView", "dojox/mobile/ContentPane", "dojo/dom-construct", "dojo/dom-style", "dojo/dom-attr", "dojo/_base/fx", "dojo/fx", "dojo/json", "dojo/on", "dojo/window", "dojo/request", "dojo/touch", "dojo/hash"],
    function(declare, JsonRest, dom, domGeom, registry, ScrollableView, ContentPane, domConstruct, domStyle, domAttr, baseFx, fx, JSON, on, win, request, touch, hash) {
      return declare("viki.scrollableImageView", [ScrollableView], {
        // this is now the new widget context
        
        // this handler is called when an image is clicked, and is passed an image id
        clickHandler: function(image) {
          debug.log("image clicked: " + image);
            var thumbnailView = dom.byId(image);
            var overlay = dom.byId('imageOverlay');
            domStyle.set(overlay, "height", win.getBox().h + "px"); // this is needed to properly size the view in iOS
            var thumbnailPos = domGeom.position(thumbnailView);
            var imgContainer = dom.byId('imageContainer');
            var imageElem = domConstruct.create("img", {src: '/image/get/' + image}, imgContainer);
            var closeButton = dom.byId("closeButton");
            var fullImgDim;
            var imagePadding = domStyle.get(thumbnailView, "padding");
            var thumbnailWidth = thumbnailPos.w - imagePadding * 2;
            on(imageElem, "load", function() { // binding to the load event may not work in all browsers, it is not in the W3C specs
                domStyle.set(overlay, "display", "block");
                domStyle.set(imgContainer, "width", thumbnailWidth + "px");
                domStyle.set(imgContainer, "height", thumbnailWidth + "px");
                domStyle.set(imgContainer, "left", (thumbnailPos.x + imagePadding) + "px");
                domStyle.set(imgContainer, "top", (thumbnailPos.y + imagePadding) + "px");
                domStyle.set(imgContainer, "overflow", "hidden");
                fullImgDim = domGeom.getMarginBox(imageElem);
                var imgRatio = fullImgDim.w / fullImgDim.h;
                if (fullImgDim.w > fullImgDim.h) {
                    domStyle.set(imageElem, "width", "auto");
                    domStyle.set(imageElem, "height", (thumbnailWidth) + "px");
                    domStyle.set(imageElem, "margin-left", (-(imgRatio - 1) * thumbnailWidth / 2) + "px");
                }
                else {
                    domStyle.set(imageElem, "height", "auto");
                    domStyle.set(imageElem, "width", (thumbnailWidth) + "px");
                    domStyle.set(imageElem, "margin-top", (-(1 / imgRatio - 1) * thumbnailWidth / 2) + "px");
                }
                var divSize = domGeom.getMarginBox(overlay);
                var dispRatio = divSize.w / divSize.h;
                var containerProps = {};
                var imageProps = {};
                imageProps["margin-left"] = 0;
                imageProps["margin-top"] = 0;
                imageProps.left = 0;
                imageProps.top = 0;
                var buttonsHeight = domGeom.getMarginBox(closeButton).h;
                // this if/else statement sets properties that center the image
                if (imgRatio > dispRatio) {
                    containerProps.left = 0;
                    containerProps.top = (divSize.h - divSize.w / imgRatio) / 2;
                    imageProps.width = containerProps.width = divSize.w;
                    imageProps.height = containerProps.height = (divSize.w / imgRatio);
                }
                else {
                    divSize.h -= buttonsHeight;
                    containerProps.top = buttonsHeight;
                    containerProps.left = (divSize.w - divSize.h * imgRatio) / 2;
                    imageProps.height = containerProps.height = divSize.h;
                    imageProps.width = containerProps.width = (divSize.h * imgRatio);
                }
                var overlayAnim = baseFx.animateProperty({
                    node: overlay,
                    properties: {opacity : 1},
                    duration: 500
                }).play();
                
                var containerAnim = baseFx.animateProperty({
                    node: imgContainer,
                    properties: containerProps,
                    duration: 500,
                    delay: 200
                }).play();
                
                var imageAnim = baseFx.animateProperty({
                    node: imageElem,
                    properties: imageProps,
                    duration: 500,
                    delay: 200
                }).play();
            });
            var likeButton = registry.byId("likeButton");
            likeButton.set('disabled', false);
            var likeHandler = on(likeButton, "click", function() {
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
            var tagButton = registry.byId("tagButton");
            var tagActive = false;
            var tagDiv;
            var tagBorder = 3;
            var tagX;
            var tagY;
            var tagPos;
            var touchDnEvent;
            var touchUpEvent;
            var tagHandler = on(tagButton, "click", function () {
                var imagePos = domGeom.position(imgContainer);
                if (tagActive) {
                    request.post("/image/tag/" + image, {data: {
                        x: tagX / imagePos.w, // left side of left border, as fraction of image width
                        y: tagY / imagePos.h, // same
                        width: (tagPos.w - 2 * tagBorder) / imagePos.w, // also as fraction of image dimensions
                        height: (tagPos.h - 2 * tagBorder) / imagePos.h,
                        topic: "Outdoors"
                    }}).then(function(response) {
                        console.log(response);
                    });
                    domAttr.set("tagButton", "value", "Tag");
                    touchDnEvent.remove();
                    touchUpEvent.remove();
                    domStyle.set(tagDiv, "cursor", "default");
                    domStyle.set(tagDiv, "position", "absolute");
                    //domStyle.set(tagDiv, "left", tagX + "px");
                    //domStyle.set(tagDiv, "top", tagY + "px");
                }
                else {
                    domAttr.set("tagButton", "value", "Save Tag");
                    tagDiv = domConstruct.create("div", {style: "width: 100px; height: 100px; border-style: solid; border-width: " + tagBorder + "px; border-color: #ADD8E6; z-index: 1004; position: relative; cursor: pointer;"}, imgContainer);
                    
                    var mouseTagX;
                    var mouseTagY;
                    var mousemoveHandler;
                    function touchRelease() {
                        if (isAndroid) {
                            tagDiv.removeEventListener("touchmove", mousemoveHandler);
                        }
                        else {
                            mousemoveHandler.remove();
                        }
                    }
                    touchDnEvent = touch.press(tagDiv, function(event) {
                        tagPos = domGeom.position(tagDiv);
                        mouseTagX = event.pageX - tagPos.x;
                        mouseTagY = event.pageY - tagPos.y;
                        function touchMove(event) {
                            var mousePositionX = event.pageX - imagePos.x;
                            tagX = mousePositionX - mouseTagX;
                            var mousePositionY = event.pageY - imagePos.y;
                            tagY = mousePositionY - mouseTagY;
                            if (tagX >= 0 && tagX <= imagePos.w - tagPos.w)
                                domStyle.set(tagDiv, "left", tagX + "px");
                            if (tagY >= 0 && tagY <= imagePos.h - tagPos.h)
                                domStyle.set(tagDiv, "top", tagY + "px");
                            if (mousePositionX < 5 || mousePositionX > imagePos.w - 5 || mousePositionY < 5 || mousePositionY > imagePos.h - 5)
                                touchRelease();
                        }
                        if (isAndroid) {
                            mousemoveHandler = function (event) {
                                event.preventDefault();
                                touchMove(event.targetTouches[0]);
                            };
                            tagDiv.addEventListener("touchmove", mousemoveHandler);
                        }
                        else {
                            mousemoveHandler = touch.move(tagDiv, function (event) {
                                event.preventDefault();
                                touchMove(event);
                            });
                        }
                    });
                    touchUpEvent = touch.release(tagDiv, touchRelease);
                }
                tagActive = !tagActive;
            });
            var closeHandler = on(closeButton, "click", function() {
                likeHandler.remove();
                tagHandler.remove();
                closeHandler.remove();
                
                var containerProps = {};
                containerProps.width = thumbnailWidth;
                containerProps.height = thumbnailWidth;
                containerProps.left = thumbnailPos.x + imagePadding;
                containerProps.top = thumbnailPos.y + imagePadding;
                
                var imgRatio = fullImgDim.w / fullImgDim.h;
                var imageProps = {};
                if (fullImgDim.w > fullImgDim.h) {
                    imageProps.width = imgRatio * thumbnailWidth;
                    imageProps.height = thumbnailWidth;
                    imageProps["margin-left"] = -(imgRatio - 1) * thumbnailWidth / 2;
                }
                else {
                    imageProps.width = thumbnailWidth;
                    imageProps.height = thumbnailWidth / imgRatio;
                    imageProps["margin-top"] = -(1 / imgRatio - 1) * thumbnailWidth / 2;
                }
                
                var overlayFade = baseFx.animateProperty({
                    node: overlay,
                    properties: {opacity: 0},
                    duration: 500,
                    delay: 300
                }).play();
                
                var containerResize = baseFx.animateProperty({
                    node: imgContainer,
                    properties: containerProps,
                    duration: 500
                }).play();
                
                var imageResize = baseFx.animateProperty({
                    node: imageElem,
                    properties: imageProps,
                    duration: 500
                }).play();
                
                on(overlayFade, "End", function() {
                    domConstruct.empty(imgContainer);
                    domStyle.set(overlay, "display", "none");
                });
                
                if (tagActive) {
                    var tagFade = baseFx.animateProperty({
                        node: tagDiv,
                        properties: {opacity: 0, width: 0, height: 0},
                        duration: 300
                    }).play();
                    domAttr.set("tagButton", "value", "Tag");
                    tagActive = false;
                }
            });
        },
        // this is called when the view if first created - setup and such
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
          
          this.getPage = function () {
            debug.log("getPage called");
            var images = imageStore.query({type:'JSON', topic:'Outdoors', pageSize: numImages, pagesViewed:pagesDisplayed}).map(function(image) {
            var aElem = domConstruct.create("a", {cursor:'pointer'}, imageDiv);
            domConstruct.create("img", {src: '/image/get/' + image.thumbnailid, height: imageWidth, width: imageWidth, id: image.dataid, 
                                        onclick: function(){handler(this.id)}  }, aElem);
            //debug.log("image retrieved...");
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
          
          //this.singleImageView = new singleImageView({overlayID: "imageOverlay"});
        },
        numVisibleImages: function() {
          var dims = domGeom.getContentBox(dom.byId(hash()));
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
          }
        }
        // end widget
      });
    });
