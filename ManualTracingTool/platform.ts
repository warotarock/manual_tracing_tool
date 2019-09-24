
declare var require: any;

namespace Platform {

    export let fs = (typeof (require) != 'undefined') ? require('fs') : {

        readFile(fileName, text): string {
            return window.localStorage.getItem(fileName);
        },

        writeFile(fileName, text) {
            window.localStorage.setItem(fileName, text);
        }
    };

    class Settings {

        data = {
            "MTT-Settings Index": 3,
            "MTT-Settings1": {
                "lastUsedFilePaths": [],
                "exportPath": ".\\",
                "referenceDirectoryPath": ".\\",
                "currentDirectoryPath": ".\\"
            }
        };

        load() {

            let text = fs.readFileSync('settings.json');
            let json = JSON.parse(text);

            if (json) {

                this.data = json;
            }
            else {

            }
        }

        setItem(key: string, value: object) {

            this.data[key] = value;

            fs.writeFileSync('settings.json', JSON.stringify(this.data));
        }

        getItem(key: string): any {

            return this.data[key];
        }
    };

    export let settings = new Settings();

    export let clipboard: Clipboard = (typeof (require) != 'undefined') ? require('electron').clipboard : {

        writeText(text: string, type: string) {
            window.localStorage.setItem('clipboard', text);
        },

        readText(type: string): string {
            return window.localStorage.getItem('clipboard');
        },

        availableFormats(type: string): string {
            return window.localStorage.getItem('clipboard') ? 'clipboard' : null;
        }
    };
}