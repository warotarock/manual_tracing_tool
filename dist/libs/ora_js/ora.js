(function (obj) {
    'use strict';

    // Extract an image from the ora into an Image object
    function extractImage(path, zipfs, ondone, onerror) {
        var imgEntry = zipfs.find(path);
        if (imgEntry) {
            imgEntry.getData64URI('image/png', function (uri) {
                var imageObj = new Image();
                imageObj.onload = ondone;
                imageObj.src = uri;
            });
        } else if (onerror) {
            onerror();
        }
    }

    // Resize a canvas to the given size
    function resize(canvas, width, height, callback) {
        if(canvas.width <= width && canvas.height <= height) {
            callback();
            return;
        }

        var ctx = canvas.getContext('2d'),
            oldCanvas = canvas.toDataURL("image/png"),
            img = new Image(),
            aspect = canvas.width / canvas.height;

        if(aspect >= 1) {
            height = width / aspect;
        }
        else {
            width = height * aspect;
        }

        img.src = oldCanvas;
        img.onload = function () {
            canvas.width = width;
            canvas.height = height;
            ctx.clearRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            callback();
        };
    }

    // Layer object constructor.
    function Layer(width, height, name) {
        this.name = name;
        this.width = width || 0;
        this.height = height || 0;
        this.x = 0;
        this.y = 0;
        this.composite = 'svg:src-over';
        this.opacity = 1;
        this.visibility = 'visible';
    }

    // Draw layer onto a new canvas element
    Layer.prototype.toCanvas = function (canvas, width, height, noOffset) {
        var tmpCanvas = canvas || document.createElement('canvas');
        tmpCanvas.width = width || this.width;
        tmpCanvas.height = height || this.height;

        var tmpCtx = tmpCanvas.getContext('2d');
        tmpCtx.clearRect(0, 0, tmpCanvas.width, tmpCanvas.height);
        if(noOffset) {
            tmpCtx.drawImage(this.image, 0, 0);
        } else {
            tmpCtx.drawImage(this.image, this.x, this.y);
        }
        return tmpCanvas;
    };

    // OraFile constructor
    function OraFile(width, height) {
        this.width = width || 0;
        this.height = height || 0;
        this.layers = [];
    }

    // Load the file contents from a blob
    // Based on the draft specification from May 2013
    // http://www.freedesktop.org/wiki/Specifications/OpenRaster/Draft/
    OraFile.prototype.load = function (blob, onload) {
        zip.workerScriptsPath = obj.ora.scriptsPath;
        zip.useWebWorkers = obj.ora.enableWorkers;

        var fs = new zip.fs.FS(),
            that = this;

        function loadLayers(image, ondone) {
            var layersLoaded = 0,
               layerElems = image.getElementsByTagName('stack')[0].getElementsByTagName('layer');

            var layerCount = layerElems.length;
            that.layers = [];

            var onExtract = function(layer) {
                return function() {
                    layer.image = this;
                    layer.width = this.width;
                    layer.height = this.height;

                    layersLoaded++;
                    if (layersLoaded === layerCount) {
                        ondone();
                    }
                };
            };

            for (var i = layerCount - 1; i >= 0; i--) {
                var layer = new Layer();
                var layerElement = layerElems[i];

                layer.name = layerElement.getAttribute('name');
                layer.x = layerElement.getAttribute('x') || 0;
                layer.y = layerElement.getAttribute('y') || 0;
                layer.composite = layerElement.getAttribute('composite-op') || 'svg:src-over';
                layer.opacity = layerElement.getAttribute('opacity') || 1;
                layer.visibility = layerElement.getAttribute('visibility') || 'visible';

                extractImage(layerElement.getAttribute('src'), fs, onExtract(layer));

                that.layers.push(layer);
            }
        }

        function loadStack(ondone) {
            var stackFile = fs.find('stack.xml');
            var onExtract = function(text) {
                var xml;
                // http://stackoverflow.com/questions/649614/xml-parsing-of-a-variable-string-in-javascript
                var parseXml;

                if (window.DOMParser) {
                    xml = ( new window.DOMParser() ).parseFromString(text, "text/xml");
                } else {
                    xml = new window.ActiveXObject("Microsoft.XMLDOM");
                    xml.async = false;
                    xml.loadXML(text);
                }

                var img = xml.getElementsByTagName('image')[0];
                that.width = img.getAttribute('w');
                that.height = img.getAttribute('h');

                loadLayers(img, ondone);
            };

            // for some reason Firefox (23.0.1 and earlier) doesn't like getText, so we roll our own
            stackFile.getBlob("text/xml", function (blob) {
                var reader = new FileReader();
                reader.onload = function(e) {
                    onExtract(e.target.result);
                };
                reader.readAsText(blob, 'UTF-8');
            });
        }

        function loadOra() {
            // keeping track of finished loading tasks
            var stepsDone = 0, steps = 3;
            var onDone = function () {
                stepsDone++;
                if (stepsDone === steps) {
                    onload();
                }
            };

            extractImage('Thumbnails/thumbnail.png', fs, function() {
                that.thumbnail = this;
                onDone();
            }, onDone);

            extractImage('mergedimage.png', fs, function() {
                that.prerendered = this;
                onDone();
            }, onDone);

            loadStack(onDone);
        }

        fs.importBlob(blob, loadOra);
    };

    OraFile.prototype.save = function (jsonTextFileName, jsonText, ondone) {
        zip.workerScriptsPath = obj.ora.scriptsPath;
        zip.useWebWorkers = obj.ora.enableWorkers;

        var fs = new zip.fs.FS(),
            thumbs = fs.root.addDirectory('Thumbnails'),
            data = fs.root.addDirectory('data'),
            tmpCanvas = document.createElement('canvas'),
            xmlDoc = document.implementation.createDocument(null, null, null),
            serializer = new XMLSerializer(),
            i = this.layers.length,
            layer, url, name, xelem, celem;

        fs.root.addText("mimetype", "image/openraster");


        xelem = xmlDoc.createElement('image');
        xelem.setAttribute('w', this.width);
        xelem.setAttribute('h', this.height);
        xmlDoc.appendChild(xelem);

        celem = xmlDoc.createElement('stack');
        xelem.appendChild(celem);
        xelem = celem;

        while(i) {
            layer = this.layers[i - 1];

            celem = xmlDoc.createElement('layer');
            celem.setAttribute('name', layer.name || ('layer' + i));
            celem.setAttribute('x', layer.x);
            celem.setAttribute('y', layer.y);
            celem.setAttribute('composite-op', layer.composite);
            celem.setAttribute('opacity', layer.opacity);
            celem.setAttribute('visibility', layer.visibility);

            url = layer.toCanvas(undefined, layer.width, layer.height, true).toDataURL('image/png');
            name = 'layer' + i + '.png';
            celem.setAttribute('src', 'data/' + name);
            data.addData64URI(name, url);
            xelem.appendChild(celem);
            i--;
        }

        fs.root.addText('stack.xml', serializer.serializeToString(xmlDoc));

        // MTT added
        fs.root.addText(jsonTextFileName, jsonText);
        // MTT added

        this.drawComposite(tmpCanvas, function () {
            // MTT deleted
            // url = tmpCanvas.toDataURL('image/png');
            // fs.root.addData64URI('mergedimage.png', url);
            // MTT deleted

            resize(tmpCanvas, 256, 256, function() {
                url = tmpCanvas.toDataURL('image/png');
                thumbs.addData64URI('thumbnail.png', url);

                // MTT cahnged
                //fs.exportBlob(ondone, 'image/openraster');
                fs.exportData64URI(ondone);
                // MTT cahnged

            });
        });
    };

    // Draw the thumbnail into a canvas element
    OraFile.prototype.drawThumbnail = function (canvas) {
        var context = canvas.getContext('2d');

        if (this.thumbnail) {
            canvas.width = this.thumbnail.width;
            canvas.height = this.thumbnail.height;
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.drawImage(this.thumbnail, 0, 0);
        }
        else {
            context.clearRect(0, 0, canvas.width, canvas.height);
        }
    };

    // Draw the full size composite image from the layer data.
    // Uses the prerendered image if present and enabled
    OraFile.prototype.drawComposite = function (canvas, ondone) {
        canvas.width = this.width;
        canvas.height = this.height;

        if(!this.layers) {
            if(ondone) {
                ondone();
            }

            return;
        }

        var context = canvas.getContext('2d');

        context.clearRect(0, 0, canvas.width, canvas.height);

        if(obj.ora.enablePrerendered && this.prerendered) {
            context.drawImage(this.prerendered, 0, 0);
            return;
        }

        if (!obj.blending) {
            composeNoBlend(this, context, ondone);
            return;
        }

        if(!obj.ora.enableWorkers || !window.Worker) {
            compose(this, context, ondone);
            return;
        }

        composeWorkers(this, context, ondone);
    };

    function composeWorkers (oraFile, context, ondone) {
        var layerCache = [],
            startLayer = -1,
            worker, i, tmpCanvas;

        for (i = 0; i < oraFile.layers.length; i++) {
            if(oraFile.layers[i].visibility != 'hidden') {
                if(startLayer < 0) {
                    startLayer = i;
                }

                layerCache[i] = {
                    opacity: oraFile.layers[i].opacity,
                    composite: oraFile.layers[i].composite,
                    data: oraFile.layers[i]
                        .toCanvas(tmpCanvas, oraFile.width, oraFile.height)
                        .getContext('2d')
                };
            }
        }

        if(startLayer < 0) {
            if(ondone) {
                ondone();
            }
            return;
        }

        function onTaskDone(e) {
            if(e.data.result) {
                // paint result
                context.putImageData(e.data.result, 0, 0);
                if(ondone) {
                    ondone();
                }
                worker.terminate();
                return;
            }

            var nextLayer = e.data.layer + 1;

            while(nextLayer < oraFile.layers.length && !layerCache[nextLayer]) {
                nextLayer++;
            }

            if(nextLayer >= oraFile.layers.length) {
                worker.postMessage({ done : true });
                return;
            }

            var nextBatch = {
                layer: nextLayer,
                src : layerCache[nextLayer].data.getImageData(0, 0, oraFile.width, oraFile.height),
                opacity: layerCache[nextLayer].opacity,
                filter: layerCache[nextLayer].composite
            };

            worker.postMessage(nextBatch);
        }

        worker = new Worker(obj.ora.scriptsPath + 'ora-blending.js');
        worker.onmessage = onTaskDone;

        var initData = {
            layer: startLayer,
            src: layerCache[startLayer].data.getImageData(0, 0, oraFile.width, oraFile.height),
            opacity: layerCache[startLayer].opacity,
            filter: layerCache[startLayer].composite,
            dst: context.getImageData(0, 0, oraFile.width, oraFile.height)
        };

        worker.postMessage(initData);
    }

    function compose (oraFile, context, ondone) {
        var imgData = context.getImageData(0, 0, oraFile.width, oraFile.height),
            layerCount = oraFile.layers.length,
            layerIdx = 0,
            layer, tmpCanvas;

        while (layerCount > layerIdx) {
            layer = oraFile.layers[layerIdx];

            if (layer && layer.image && (layer.visibility === 'visible' || layer.visibility === undefined)) {
                var filter = obj.blending[layer.composite] || obj.blending.normal;
                var srcCanvas = layer.toCanvas(tmpCanvas, oraFile.width, oraFile.height);
                var src = srcCanvas.getContext('2d').getImageData(0, 0, srcCanvas.width, srcCanvas.height).data;
                obj.blending.blend(src, imgData.data, layer.opacity, filter);
            }

            layerIdx++;
        }

        context.putImageData(imgData, 0, 0);

        if(ondone) {
            ondone();
        }
    }

    function composeNoBlend(oraFile, context, ondone) {
        var layerCount = oraFile.layers.length,
            layerIdx = 0,
            layer;

        while (layerCount > layerIdx) {
            layer = oraFile.layers[layerIdx];
            if (layer && layer.image && (layer.visibility === 'visible' || layer.visibility === undefined)) {
                if (layer.opacity === undefined) {
                    context.globalAlpha = 1;
                } else {
                    context.globalAlpha = layer.opacity;
                }

                context.drawImage(layer.image, layer.x, layer.y);
            }

            layerIdx++;
        }

        if(ondone) {
            ondone();
        }
    }

    // Add a new layer to the image
    // index can optionally specify the position for the new layer
    OraFile.prototype.addLayer = function (name, index) {
        var layer = new Layer(this.width, this.height, name);
        if(index !== undefined && index < this.layers.length && index >= 0) {
            this.layers.splice(index, 0, layer);
        } else {
            this.layers.push(layer);
        }
        return layer;
    };

    // Create and populate an OraFile object from a blob
    // onload - callback with the loaded object as parameter
    function loadFile(blob, onload) {
        var oraFile = new OraFile();
        oraFile.load(blob, function() {
            onload(oraFile);
        });
    }

    obj.ora = {
        Ora : OraFile,
        OraLayer : Layer,
        load: loadFile,

        // enable use of prerendered image instead of layers (if present)
        enablePrerendered : true,
        enableWorkers : true,
        scriptsPath : ''
    };
})(this);
