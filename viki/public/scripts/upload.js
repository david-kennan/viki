// upload view js file
require(["dojox/mobile/parser", "dojo/dom", "dijit/registry", "dojo/dom-construct", "dojo/ready", "dojox/validate/_base", "dojo/hash", "dojo/store/JsonRest", "dojo/store/Memory"],
    function(parser, dom, registry, construct, ready, validate, hash, JsonRest, Memory) {
      debug.log("loaded upload.js...");
      
      var form;
      var uploader;
      var topicBox;
      var submitString = "Add Image to Viki";
    
      // stores for topics - need both ;-(
      var memoryStore =  new Memory({idProperty: 'name'});
      var topicStore = new JsonRest({target: '/topic/all', idProperty: 'name'});

      // ideally use dojo's own validation, but seems a bit complicated so we will do this for now
      var isValid = function () {
        // check that gist is not empty
        if (!validate.isText(dom.byId('gist').value)) {
          alert("Gist must not be empty");
          return false
        }
        // check that topic is not empty
        else if (!validate.isText(dom.byId('topic').value)) {
          alert("Topic must not be empty");
          return false
        }
        else {
          return true;
        }
      }

      // once a file has been uploaded, reset the uploader so it can be used again
      var resetUploader = function () {
        uploader = newUploader();
      }

      // create stores and and a combox for entering topics - this can be called
      // multiple times in order to refresh data
      var topicComboBox = function () {
        topicStore.query({}).map(function(topic) {
          memoryStore.put(topic);
        });
        if(!topicBox) {
          topicBox = new dojox.mobile.ComboBox({'store': memoryStore}, 'topic');
        }
      }

      // returns a fresh loader
      var newUploader = function () {
        tmp = new qq.FileUploader({
          uploadButtonText: 'Select Image',
          listElement: dom.byId('filelist'),
          element: dom.byId('fileuploader'),
          action: '/image/upload',
          onComplete: function() { 
            construct.destroy(dom.byId("placeholder"));
            registry.byId('submit').set('value', 'File Uploaded Successfully');
            resetUploader();
            topicComboBox();
            var f = function(){
              hash(_appState.hashes[0]);
            }
            setTimeout(f,500);
          },
          onSubmit: function () {
            registry.byId('submit').set('disabled', false);
            registry.byId('submit').set('value', submitString);
          },
          allowedExtensions: ['jpg','jpeg','png','bmp','tiff'],
          acceptFiles: ['image/*'],
          multiple: false,
          autoUpload: false,
        });
        dom.byId('gist').value = 'My Cool Image';
        registry.byId('submit').set('disabled', true);
        return tmp; 
      }


      // this sets everything up on dom load
      ready(function() {
        // create autocomplete textbox, after calling for new data
        topicComboBox();
        
        // initialize form
        form = registry.byId('uploadForm');
        uploader = newUploader();
        registry.byId('submit').on('click', function() {
          if (isValid()) {
            uploader.setParams({imagename: dom.byId('gist').value, imagetopic: dom.byId('topic').value});
            uploader.uploadStoredFiles();
          }
          else {
            debug.log("Form validation error.");
          }
        });
      });

});
