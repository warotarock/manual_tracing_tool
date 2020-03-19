var Platform;
(function (Platform) {
    function supportsNative() {
        return (typeof (require) != 'undefined');
    }
    function getCurrentTime() {
        return performance.now();
    }
    Platform.getCurrentTime = getCurrentTime;
    Platform.fs = supportsNative() ? require('fs') : {
        readFileSync: function (fileName) {
            return window.localStorage.getItem(fileName);
        },
        writeFile: function (fileName, text) {
            window.localStorage.setItem(fileName, text);
        }
    };
    function writeFileSync(fileName, data, format, callback) {
        if (format == 'base64') {
            if (supportsNative()) {
                var base64Data = data.substr(data.indexOf(',') + 1);
                Platform.fs.writeFileSync(fileName, base64Data, format, callback);
            }
            else {
                var link = document.createElement("a");
                link.download = fileName;
                link.href = data;
                link.click();
            }
        }
        else {
            Platform.fs.writeFileSync(fileName, data, format, callback);
        }
    }
    Platform.writeFileSync = writeFileSync;
    var Settings = /** @class */ (function () {
        function Settings() {
            this.data = {
                "activeSettingName": "setting1",
                "setting1": {
                    "currentDirectoryPath": "./",
                    "referenceDirectoryPath": "./test",
                    "exportPath": "./",
                    "maxLastUsedFilePaths": 5,
                    "lastUsedFilePaths": ['./test/test01_app_demo.json']
                }
            };
        }
        Settings.prototype.load = function () {
            var text = Platform.fs.readFileSync('settings.json');
            if (text) {
                var json = JSON.parse(text);
                if (json) {
                    this.data = json;
                }
            }
        };
        Settings.prototype.setItem = function (key, value) {
            this.data[key] = value;
            Platform.fs.writeFileSync('settings.json', JSON.stringify(this.data));
        };
        Settings.prototype.getItem = function (key) {
            return this.data[key];
        };
        return Settings;
    }());
    ;
    Platform.settings = new Settings();
    Platform.clipboard = supportsNative() ? require('electron').clipboard : {
        writeText: function (text, type) {
            window.localStorage.setItem('clipboard', text);
        },
        readText: function (type) {
            return window.localStorage.getItem('clipboard');
        },
        availableFormats: function (type) {
            return window.localStorage.getItem('clipboard') ? 'clipboard' : null;
        }
    };
})(Platform || (Platform = {}));
