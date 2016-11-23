ArkeoGIS.factory('arkeoDownload', [function() {
    return {
        openAsFile : function(response){

            // parse content type header
            var contentTypeStr = response.headers('Content-Type');
            var tokens = contentTypeStr.split('/');
            var subtype = tokens[1].split(';')[0];
            var contentType = {
                type : tokens[0],
                subtype : subtype
            };

            // parse content disposition header, attempt to get file name
            var contentDispStr = response.headers('Content-Disposition');
            var proposedFileName = contentDispStr ? contentDispStr.split('=')[1] : 'data.'+contentType.subtype;

            // build blob containing response data
            var blob = new Blob([response.data], {type : contentTypeStr});

            if (typeof window.navigator.msSaveBlob !== 'undefined'){
                // IE : use proprietary API
                window.navigator.msSaveBlob(blob, proposedFileName);
            }else{
                var downloadUrl = URL.createObjectURL(blob);

                // build and open link - use HTML5 a[download] attribute to specify filename
                var a = document.createElement("a");

                // safari doesn't support this yet
                if (typeof a.download === 'undefined') {
                    window.open(downloadUrl);
                }

                var link = document.createElement('a');
                link.href = downloadUrl;
                link.download = proposedFileName;
                document.body.appendChild(link);
                var event = new MouseEvent('click', {
                  'view': window,
                  'bubbles': true,
                  'cancelable': true
                });
                link.dispatchEvent(event);
                document.body.removeChild(link);
            }
        }
    }
}]);
