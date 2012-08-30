// Viki main js file, loaded on every page
// 8/22/12
// Load the widget parser and mobile base

// debugger
var debug = {};
debug.enabled = true;
debug.log = function(message) {
  if(this.enabled) console.log("Viki Debug Message: "+message)
}
// end debugger

// the main code, loaded with the app
require(["dojox/mobile/parser", "dojox/mobile/deviceTheme", "dojox/mobile/ScrollableView", "dojox/mobile/TabBar", "dojox/mobile/ContentPane", "dojox/mobile/compat", "dojox/mobile", "dojox/mobile/Button", "dojox/mobile/TextBox", "custom/scrollableImageView" ], 
    function(mobileParser, deviceTheme) {
      mobileParser.parse();
      debug.log("loaded dojo etal...");

      // When the view changes, update the title as well
      require(["dojo/topic", "dojo/dom"], function(topic, dom){
        topic.subscribe("/dojox/mobile/afterTransitionIn", function(e){
          if (e.id == "upload") {
            dom.byId("titleheader").innerHTML = appName + " | Upload";
          }
          else if (e.id == "viewimages") {
            dom.byId("titleheader").innerHTML = appName + " | View Images";
          }
          else if (e.id == "welcome") {
            dom.byId("titleheader").innerHTML = appName + " | Welcome";
          }
        });
      });
    });
