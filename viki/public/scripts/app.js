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

require(["dojox/mobile/parser", "dojox/mobile/deviceTheme", "dojox/mobile",], function(parser) {
  parser.parse();
  debug.log("loaded dojox/mobile");
});

