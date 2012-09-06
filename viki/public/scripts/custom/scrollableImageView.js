define(["dojo/_base/declare", "dojo/store/JsonRest", "dojo/dom", "dojo/dom-geometry", "dijit/registry", "dojox/mobile/ScrollableView", "dojox/mobile/ContentPane", "dojo/dom-construct", "dojo/dom-style", "dojo/dom-attr", "dojo/_base/fx", "dojo/fx", "dojo/json", "dojo/on", "dojo/window", "dojo/request", "dojo/touch", "dojo/hash", "dojo/_base/array", "dojo/store/JsonRest", "dojo/store/Memory"],
    function(declare, JsonRest, dom, domGeom, registry, ScrollableView, ContentPane, domConstruct, domStyle, domAttr, baseFx, fx, JSON, on, win, request, touch, hash, array, JsonRest, Memory) {
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
                
                
                // GET tags for this image
                request('/image/tag/' + image, {handleAs: "json"}).then(function(tags) {
                    array.forEach(tags, function(item, index) {
                        // The following properties are stored as fractions of the image's width and height
                        var tagLeft = item.x * imageProps.width;
                        var tagTop = item.y * imageProps.height;
                        var tagWidth = item.width * imageProps.width;
                        var tagHeight = item.height * imageProps.height;
                        domConstruct.create("div", {style: ("width:" + tagWidth + "px; height:" + tagHeight + "px; left:" + tagLeft + "px; top:" + tagTop + "px;"), class:"Tag"}, imgContainer);
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
                domAttr.set("likeButton", "src", "/images/liked.png");
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
            var tagContainer;
            var tagDiv;
            var tagBorder = 3; // this is also hardcoded in style.css - don't forget to change it there
            var tagX;
            var tagY;
            var tagPos;
            var touchDnEvent;
            var mousemoveHandler;
            var touchUpEvent;
            var mouseOutBuffer = 15;
            var dropDnSpace = 5;
            var menu;
            var tagHandler = on(tagButton, "click", function () {
                var imagePos = domGeom.position(imgContainer);
                tagActive = !tagActive;
                if (!tagActive) {
                    domStyle.set(cancelButton, "display", "none");
                    var tagSize = domGeom.position(tagDiv);
                    request.post("/image/tag/" + image, {data: {
                        x: (tagX + mouseOutBuffer) / imagePos.w, // left side of left border, as fraction of image width
                        y: (tagY + mouseOutBuffer) / imagePos.h, // same
                        width: (tagSize.w - 2 * tagBorder) / imagePos.w, // also as fraction of image dimensions
                        height: (tagSize.h - 2 * tagBorder) / imagePos.h,
                        topic: menu.value
                    }}).then(function(response) {
                        console.log(response);
                    });
                    domAttr.set("tagButton", "src", "/images/tag.png");
                    touchDnEvent.remove();
                    touchUpEvent.remove();
                    
                    domStyle.set(tagContainer, "cursor", "default");
                    domStyle.set(tagContainer, "position", "absolute");
                    domConstruct.destroy(menu);
                    
                    if (isAndroid) {
                        tagContainer.removeEventListener("touchmove", mousemoveHandler);
                    }
                }
                else {
                    domStyle.set(cancelButton, "display", "inline-block");
                    domAttr.set("tagButton", "src", "/images/save.png");
                    var defaultTagSize = 100;
                    tagContainer = domConstruct.create("div", {style: "position: relative; cursor: pointer; width:" + (defaultTagSize + 2 * mouseOutBuffer) + "px; height:" + (mouseOutBuffer + defaultTagSize) + "px; left:" + (imagePos.w / 2 - defaultTagSize / 2 - mouseOutBuffer) + "px; top:" + (imagePos.h / 2 - defaultTagSize / 2 - mouseOutBuffer) + "px;"}, imgContainer);
                    tagDiv = domConstruct.create("div", {style: "left:" + (mouseOutBuffer - tagBorder) + "px; top:" + mouseOutBuffer + "px; width:" + defaultTagSize + "px; height:" + defaultTagSize + "px;", class: "Tag"}, tagContainer);
                    menu = domConstruct.create("select", {style: "position: absolute; top:" + (mouseOutBuffer + defaultTagSize + dropDnSpace) + "px; left:" + (mouseOutBuffer - tagBorder) + "px"}, tagContainer);
                    request('/topic/all', {handleAs: "json"}).then(function(topics) {
                        array.forEach(topics, function(item, index) {
                            domConstruct.create("option", {value: item.name, innerHTML: item.name}, menu);
                        });
                    });
                    
                    var mouseTagX;
                    var mouseTagY;
                    function touchRelease () {
                        if (!isAndroid)
                            mousemoveHandler.remove();
                    }
                    touchDnEvent = touch.press(tagContainer, function(event) {
                        tagPos = domGeom.position(tagContainer);
                        mouseTagX = event.pageX - tagPos.x;
                        mouseTagY = event.pageY - tagPos.y;
                        var tagSize = domGeom.position(tagDiv);
                        var menuSize = domGeom.position(menu);
                        console.log(menuSize);
                        function touchMove(event) {
                            var mousePositionX = event.pageX - imagePos.x;
                            tagX = mousePositionX - mouseTagX;
                            var mousePositionY = event.pageY - imagePos.y;
                            tagY = mousePositionY - mouseTagY;
                            
                            if (tagX < tagBorder - mouseOutBuffer)
                                domStyle.set(tagContainer, "left", (tagBorder - mouseOutBuffer) + "px");
                            else if (tagX > imagePos.w - tagSize.w - mouseOutBuffer + tagBorder)
                                domStyle.set(tagContainer, "left", (imagePos.w - tagSize.w - mouseOutBuffer + tagBorder) + "px");
                            else
                                domStyle.set(tagContainer, "left", tagX + "px");
                            
                            if (tagY < -mouseOutBuffer)
                                domStyle.set(tagContainer, "top", -mouseOutBuffer + "px");
                            else if (tagY > imagePos.h - tagSize.h - mouseOutBuffer)
                                domStyle.set(tagContainer, "top", (imagePos.h - tagSize.h - mouseOutBuffer) + "px");
                            else
                                domStyle.set(tagContainer, "top", tagY + "px");
                            
                            if (tagY >= imagePos.h - tagSize.h - mouseOutBuffer - dropDnSpace - menuSize.h) {
                                domStyle.set(menu, "top", (mouseOutBuffer - menuSize.h - dropDnSpace) + "px");
                            }
                            else {
                                domStyle.set(menu, "top", (mouseOutBuffer + tagSize.h - 2 * tagBorder + dropDnSpace) + "px");
                            }
                            if (mousePositionX < 5 || mousePositionX > imagePos.w - 5 || mousePositionY < 5 || mousePositionY > imagePos.h - 5)
                                touchRelease();
                        }
                        if (isAndroid) {
                            mousemoveHandler = function (event) {
                                event.preventDefault();
                                touchMove(event.targetTouches[0]);
                            };
                            tagContainer.addEventListener("touchmove", mousemoveHandler);
                        }
                        else {
                            mousemoveHandler = touch.move(tagContainer, function (event) { // this event not fired on android
                                event.preventDefault();
                                touchMove(event);
                            });
                        }
                    });
                    touchUpEvent = touch.release(tagContainer, touchRelease); // this event not fired on android
                }
            });
            var tagCancelHandler = on(registry.byId("cancelTag"), "click", function() {
                domAttr.set("tagButton", "src", "/images/tag.png");
                domStyle.set(cancelButton, "display", "none");
                domConstruct.destroy(tagContainer);
                tagActive = false;
            });
            var closeHandler = on(closeButton, "click", function() {
                domAttr.set("likeButton", "src", "/images/like.png");
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
                        node: tagContainer,
                        properties: {opacity: 0, width: 0, height: 0},
                        duration: 300
                    }).play();
                    domAttr.set("tagButton", "src", "/images/tag.png");
                    tagActive = false;
                }
            });
        },
        // this is called when the view if first created - setup and such
        startup: function() {
          debug.log("viki.scrollableImageView init...");
          debug.log("viki.scrollableImageView topic: " + this.topic);
          _appState.currTopic = this.topic;  // BAD: break of encapsulation, fix this soon
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
            var images = imageStore.query({type:'JSON', topic: this.topic, pageSize: numImages, itemsViewed:itemsDisplayed}).map(function(image) {
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
                domConstruct.place("<div id='bottomInfo'><center>Hint: Pull up to retrieve more images.</center></div>", 
                                   registry.byId('viewimages').containerNode , "last");
                firstimeHint = false;
              }
              else if (!firstimeHint && !d.length && !firstimeIns && !dom.byId('bottomInfo')) {
                domConstruct.place("<div id='bottomInfo'><center>No more images, check back later.</center></div>", 
                                   registry.byId('viewimages').containerNode , "last");
              } else if (!firstimeHint && d.length && !firstimeIns && dom.byId('bottomInfo')) {
                domConstruct.destroy('bottomInfo');
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
          var dims = win.getBox();
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
