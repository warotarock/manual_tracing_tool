var Platform;
(function (Platform) {
    Platform.fs = (typeof (require) != 'undefined') ? require('fs') : {
        readFileSync(fileName) {
            return window.localStorage.getItem(fileName);
        }
    };
    function supportsFileSystem() {
        return (typeof (require) != 'undefined');
    }
    Platform.supportsFileSystem = supportsFileSystem;
    function writeFileSync(fileName, data, format, callback) {
        if (format == 'base64') {
            if (supportsFileSystem()) {
                let base64Data = data.substr(data.indexOf(',') + 1);
                Platform.fs.writeFileSync(fileName, base64Data, format, callback);
            }
            else {
                let link = document.createElement("a");
                link.download = fileName;
                link.href = data;
                link.click();
            }
        }
        else {
            window.localStorage.setItem(fileName, data);
        }
    }
    Platform.writeFileSync = writeFileSync;
    function getCurrentTime() {
        return performance.now();
    }
    Platform.getCurrentTime = getCurrentTime;
    class Settings {
        constructor() {
            this.data = {
                "MTT-Settings Index": 3,
                "MTT-Settings1": {
                    "lastUsedFilePaths": [],
                    "maxLastUsedFilePaths": 5,
                    "exportPath": ".\\",
                    "referenceDirectoryPath": ".\\",
                    "currentDirectoryPath": ".\\"
                }
            };
        }
        load() {
            let text = Platform.fs.readFileSync('settings.json');
            let json = JSON.parse(text);
            if (json) {
                this.data = json;
            }
            else {
            }
        }
        setItem(key, value) {
            this.data[key] = value;
            Platform.fs.writeFileSync('settings.json', JSON.stringify(this.data));
        }
        getItem(key) {
            return this.data[key];
        }
    }
    ;
    Platform.settings = new Settings();
    Platform.clipboard = (typeof (require) != 'undefined') ? require('electron').clipboard : {
        writeText(text, type) {
            window.localStorage.setItem('clipboard', text);
        },
        readText(type) {
            return window.localStorage.getItem('clipboard');
        },
        availableFormats(type) {
            return window.localStorage.getItem('clipboard') ? 'clipboard' : null;
        }
    };
})(Platform || (Platform = {}));
