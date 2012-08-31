define(["dojo/_base/declare", "dojo/store/JsonRest", "dojo/dom", "dojo/dom-geometry", "dijit/registry", "dojox/mobile/ScrollableView", "dojox/mobile/ContentPane", "dojo/dom-construct", "dojo/dom-style", "dojo/dom-attr", "dojo/_base/fx", "dojo/fx", "dojo/json", "dojo/on", "dojo/window", "dojo/request", "dojo/touch", "dojo/hash", "dojo/_base/array"],
    function(declare, JsonRest, dom, domGeom, registry, ScrollableView, ContentPane, domConstruct, domStyle, domAttr, baseFx, fx, JSON, on, win, request, touch, hash, array) {
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
                
                
                // Get tags for this image
                request('/image/tag/' + image).then(function(tags) {
                    var tagArray = JSON.parse(tags);
                    array.forEach(tagArray, function(item, index) {
                        // The following properties are stored as fractions of the image's width and height
                        var tagLeft = item.x * imageProps.height;
                        //console.log(tagLeft);
                        var tagTop = item.y * imageProps.height;
                        var tagWidth = item.width * imageProps.width;
                        var tagHeight = item.height * imageProps.height;
                        var styleString = 
                        domConstruct.create("div", {style: ("left:" + tagLeft + "px; top:" + tagTop + "px; width:" + tagWidth + "px; height:" + tagHeight + "px")}, imageContainer);
                    });
                });
                
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
            var cancelButton = dom.byId("cancelTag");
            var tagActive = false;
            var tagDiv;
            var tagBorder = 3; // this is also hardcoded in style.css - don't forget to change it there
            var tagX;
            var tagY;
            var tagPos;
            var touchDnEvent;
            var touchUpEvent;
            var tagHandler = on(tagButton, "click", function () {
                var imagePos = domGeom.position(imgContainer);
                tagActive = !tagActive;
                if (!tagActive) {
                    domStyle.set(cancelButton, "display", "none");
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
                }
                else {
                    domStyle.set(cancelButton, "display", "inline-block");
                    domAttr.set("tagButton", "value", "Save");
                    tagDiv = domConstruct.create("div", {style: "position: relative; cursor: pointer; width: 100px; height: 100px;"}, imgContainer);
                    
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
            });
            var tagCancelHandler = on(registry.byId("cancelTag"), "click", function() {
                domAttr.set("tagButton", "value", "Tag");
                domStyle.set(cancelButton, "display", "none");
                domConstruct.destroy(tagDiv);
                tagActive = false;
            });
            var closeHandler = on(closeButton, "click", function() {
                domStyle.set(cancelButton, "display", "none");
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
          var itemsDisplayed = 0;
          var imageDiv = dom.byId(this.containerNode); // this inserts elements directly into the pane
          this.addChild(new ContentPane({href: this.source}));
          var imageWidth = imgDispInfo.imageDim - 6;
          var imageStore = new JsonRest({target: this.source});
          var firstimeIns = true;
          var firstimeHint = true;
          var firstimeAdd = true;

          this.getPage = function () {
            debug.log("getPage called");
            var images = imageStore.query({type:'JSON', topic:'Outdoors', pageSize: numImages, itemsViewed:itemsDisplayed}).map(function(image) {
            if (firstimeIns) {
              imageDiv.innerHTML = "";
              firstimeIns = false;
            }
            var aElem = domConstruct.create("a", {cursor:'pointer'}, imageDiv);
            domConstruct.create("img", {src: '/image/get/' + image.thumbnailid, height: imageWidth, width: imageWidth, id: image.dataid, 
                                        onclick: function(){handler(this.id)}  }, aElem);
            if (firstimeAdd && !firstimeHint ) {
              domConstruct.destroy('bottomInfo');
              firstimeAdd = false;
            }
            return 0;
            });
            images.then(function(d) {
              if (firstimeHint && d.length) {
                domConstruct.place("<div id='bottomInfo'><center>Hint: Pull up to retrieve more images</center></div>", 
                                   registry.byId('viewimages').containerNode , "last");
                firstimeHint = false;
              }
              itemsDisplayed += d.length;
              debug.log("retrieved " + d.length + " images");
            });
            return images;
          }

          // get the first set of images, showing a message if there are no images
          this.getPage().then(function(d){
            if (!d.length) {
              imageDiv.innerHTML = "There are no images in " + appName + ", use the upload tab to add images," + 
                                    "or pull up on the arrow to get new content.<p><center><img src='/images/upArrow.png'></center>";
            firstimeHint = true;
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
