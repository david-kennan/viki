define(["dojo/_base/declare", "dojo/store/JsonRest", "dojo/dom", "dojo/dom-geometry", "dijit/registry", "dojox/mobile/ScrollableView"], 
  function(declare, JsonRest, dom, domGeom, registry, ScrollableView) {
    return declare("viki.scrollableImageView", [ScrollableView], {
      // this is now the new widget context
    });
});
