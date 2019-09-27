(function(obj) {
    'use strict';
    // Layer blending functionality
    // Based on http://dev.w3.org/fxtf/compositing-1/

    importScripts('ora-blending.js');

    self.onmessage = function(e) {
        var data = e.data;

        if (!data.src) {
            postMessage({ result: self.results });
            return;
        }

        if (!self.results) {
            self.results = data.dst;
        }

        var filter = blending[data.filter] || blending.normal;
        blending.blend(data.src.data, self.results.data, data.opacity, filter);
        postMessage({ layer: data.layer });
    };
})();