// upload view js file
require(["dojox/mobile/parser", "dojo/dom", "dijit/registry", "dojo/dom-construct", "dojo/ready"],
    function(parser, dom, registry, construct, ready) {
      debug.log("loaded upload.js...");
      var uploader;
      var resetUploader = function () {
        uploader = newUploader(); 
      }
      var newUploader = function () {
        tmp = new qq.FileUploader({
          uploadButtonText: 'Select Image',
          listElement: dom.byId('filelist'),
          element: dom.byId('fileuploader'),
          action: '/image/upload',
          onComplete: function() { 
            construct.destroy(dom.byId("placeholder"));
            resetUploader();
          },
          allowedExtensions: ['jpg','jpeg','png','bmp','tiff'],
          acceptFiles: ['image/*'],
          multiple: false,
          autoUpload: false
        });
        dom.byId('gist').value = 'My Cool Image';
        return tmp; 
      }
      ready(function() {
        uploader = newUploader();
        registry.byId("submit").on("click", function() {
          uploader.setParams({imagename: dom.byId('gist').value, imagetopic: dom.byId('topic').value});
          uploader.uploadStoredFiles();
        });
      });
    });
