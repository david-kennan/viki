define(["dojo/_base/declare", "dojo/dom", "dojo/dom-geometry", "dojo/dom-construct", "dijit/_WidgetBase", "dojo/dom-style", "dojo/query"], function(declare, dom, domGeom, domConstruct, _WidgetBase, domStyle, query) {
    return declare("viki.singleImageView", null, {
        overlayID: "",
        constructor: function(args) {
            declare.safeMixin(this, args);
        },
        startup: function() {
            debug.log("viki.singleImageView init...");
            var overlay = dom.byId(overlayID);
            this.container = domGeom.create("div", {style: "position: absolute"}, overlay);
        },
        display: function(imgID) {
            var thumbnailView = dom.byId(imgID);
            var overlay = dom.byId(overlayID);
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
            var likeClick = on(likeButton, "click", function() {
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
            on(closeButton, "click", function() {
                likeClick.remove();
                
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
                    domConstruct.destroy(imageElem);
                    domStyle.set(overlay, "display", "none");
                });
            });
        }
    });
});