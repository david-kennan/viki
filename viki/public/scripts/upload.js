// upload view js file
require(["dojox/mobile/parser", "dojo/dom", "dijit/registry", "dojo/dom-construct", "dojo/ready"],
    function(parser, dom, registry, construct, ready) {
      debug.log("loaded upload.js...");
      var uploader;
      var submitString = "Add Image to Viki";

      // once a file has been uploaded, reset the uploader to it can be used again
      var resetUploader = function () {
        uploader = newUploader();
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
          },
          onSubmit: function () {
            registry.byId('submit').set('disabled', false);
            registry.byId('submit').set('value', submitString);
          },
          allowedExtensions: ['jpg','jpeg','png','bmp','tiff'],
          acceptFiles: ['image/*'],
          multiple: false,
          autoUpload: false
        });
        dom.byId('gist').value = 'My Cool Image';
        registry.byId('submit').set('disabled', true);
        return tmp; 
      }
      
      // this sets everything up on dom load
      ready(function() {
        uploader = newUploader();
        registry.byId('submit').on('click', function() {
          if (true) {
            uploader.setParams({imagename: dom.byId('gist').value, imagetopic: dom.byId('topic').value});
            uploader.uploadStoredFiles();
          }
        });
      });

    });
