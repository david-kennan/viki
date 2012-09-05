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

// global state
var _appState = {
  hashes: [null],
  defaultTopic: "Outdoors",
  currTopic: null,
  memoryTopicStore: null
}
// end state

// the main code, loaded with the app
require(["dojox/mobile/parser", "dojox/mobile/deviceTheme", "dijit/registry", "dojo/hash", "dojo/topic", "dojo/dom", "dojox/mobile/bookmarkable", "dojox/mobile/ScrollableView", "dojox/mobile/TabBar", "dojox/mobile/ContentPane", "dojox/mobile/compat", "dojox/mobile", "dojox/mobile/Button", "dojox/mobile/TextBox",  "custom/scrollableImageView", "dojox/mobile/ComboBox", "dijit/form/Select"], 
    function(mobileParser, deviceTheme, registry, hash, topic, dom) {
      // define this to update headers and buttons when needed
      var updateViews = function() {
        registry.byId(hash()+"Button").set('selected','true');
        
        // need to keep track of the previous hash
        _appState.hashes.push(hash());
        _appState.hashes.shift();
      
        // this lets you select different topics
        var switchTopicBox = new dojox.mobile.ComboBox({'store': _appState.memoryTopicStore, 'value': _appState.currTopic}, 'switchTopicBox');
        switchTopicBox.on('change', function (e) {
          images = registry.byId('viewimages');
          images.set('topic', e);
          images.startup();
        });

        if (hash() == "upload") {
          dom.byId("titleheader").innerHTML = appName + " | Upload";
        }
        else if (hash() == "viewimages") {
          //dom.byId("titleheader").innerHTML = appName + " | " + _appState.currTopic;
          dom.byId("titleheader").innerHTML = appName + " | ";
          switchTopicBox.placeAt('titleheader');
        }
        else if (hash() == "welcome") {
          dom.byId("titleheader").innerHTML = appName + " | Welcome";
        }
      }

      // if no hash is set, that means we have a first-time load
      // also update appState so we can get previous hash
      if (!hash()) {
        debug.log("first time view or page reloaded");
        hash('welcome');
        mobileParser.parse();
      } else { 
        // otherwise the page got reloaded with a hash, so update after parsing
        mobileParser.parse();
        updateViews();
      }
      _appState.hashes.push(hash());

      // When the view changes, update the title as well, and update tabBar as needed
      // this could theoretically be done using the hash* events in dojo, probably should 
      // do that later
      topic.subscribe("/dojo/hashchange", function (e) {
        updateViews();
      });

      debug.log("loaded dojo etal...");
    });
