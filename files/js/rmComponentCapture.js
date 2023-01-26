var RM = {

    // create a js array from clob
    clob2Array: function (clob, size, array) {
        loopCount = Math.floor(clob.length / size) + 1;
        for (var i = 0; i < loopCount; i++) {
            array.push(clob.slice(size * i, size * (i + 1)));
        }
        return array;
    },

    // converts DataURI to base64 string
    dataURI2base64: function(dataURI) {
        var base64 = dataURI.substr(dataURI.indexOf(',') + 1);
        return base64;
    },

    componentCapture: function () {
        // plugin attributes
        var daThis = this;
        //var regionId = daThis.action.attribute01;
        
        // MAP canvas fix
        HTMLCanvasElement.prototype.getContext = function (origFn) {
            return function (type, attribs) {
                attribs = attribs || {};
                attribs.preserveDrawingBuffer = true;
                return origFn.call(this, type, attribs);
            };
        }(HTMLCanvasElement.prototype.getContext);

        var html2canvasConfiguration = {
            useCORS: true,
            backgroundColor: null,
            logging: true,
            imageTimeout: 0
        };
        
        var vSelectorType = daThis.action.attribute05;
        
        // check the selector type
        if (vSelectorType == 'JQUERY') {
            var vRegionSelector = daThis.action.attribute01;
        } else if (vSelectorType == 'ITEM') {
            var vRegionSelector = apex.item(daThis.action.attribute06).getValue();
        }
        
        var vAjaxIdentifier = daThis.action.ajaxIdentifier;
        // get the type of the plugin: SAVE, DOWNLOAD
        var vPluginType = daThis.action.attribute02;
        // get the element to capture
        var elementToCapture = $(vRegionSelector)[0];

        // if the plugin type is "DOWNLOAD" then save the file locally.
        if (vPluginType == 'DOWNLOAD') {
            html2canvas(elementToCapture, html2canvasConfiguration).then(function (canvas) {
                
                // get the date and time to generate the filename
                const today = new Date();
                const yyyy = today.getFullYear();
                let mm = today.getMonth() + 1; // Months start at 0!
                let dd = today.getDate();
                let hh = today.getHours();
                let mi = today.getMinutes();
                let ss = today.getSeconds();

                if (dd < 10) dd = '0' + dd;
                if (mm < 10) mm = '0' + mm;
                if (hh < 10) hh = '0' + hh;
                if (mi < 10) mi = '0' + mi;
                if (ss < 10) ss = '0' + ss;

                const formattedToday = yyyy + mm + dd + '_' + hh + mi + ss;

                var link = document.createElement('a');
                link.download = 'capture_' + formattedToday + '.png';
                link.href = canvas.toDataURL();
                link.click();
                link.remove();
            });
          // if the plugin type is "SAVE" then save to collection  
        } else if (vPluginType == 'SAVE') {
            html2canvas(elementToCapture, html2canvasConfiguration).then(function (canvas) {

                var img = canvas.toDataURL();
                
                var base64 = RM.dataURI2base64(img);

                var f01Array = [];
                var mimeType = 'image/png';
                f01Array = RM.clob2Array(base64, 30000, f01Array);

                // AJAX call
                apex.server.plugin(vAjaxIdentifier, {
                    f01: f01Array,
                    x01: mimeType
                }, {
                    dataType: 'html',
                    // SUCESS function
                    success: function () {
                        // add apex event
                        apex.event.trigger(elementToCapture, 'screencapture-saved-db');
                    },
                    // ERROR function
                    error: function (pMessage) {
                        // add apex event
                        apex.event.trigger(elementToCapture, 'screencapture-error-db');
                        // logging
                        console.log('getImage: apex.server.plugin ERROR:', pMessage);
                    }
                });
            });
        } else {

            // TO FIX

            console.log('Conditions not matched.');
            console.log('Parameter value', vPluginType);
        }
    },
}