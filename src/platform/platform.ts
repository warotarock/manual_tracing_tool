import { int } from 'base/conversion';
import { LocalSetting } from 'base/data';


var require = window['require'];

export module Platform {

    function supportsNative(): boolean {

        return (typeof (require) != 'undefined');
    }

    export function getCurrentTime(): int {

        return performance.now();
    }

    export let fs = supportsNative() ? require('fs') : {

        readFileSync(fileName): string {
            return window.localStorage.getItem(fileName);
        },

        writeFile(fileName, text) {
            window.localStorage.setItem(fileName, text);
        }
    };

    export function writeFileSync(fileName, data, format, callback) {

        if (format == 'base64') {

            if (supportsNative()) {

                let base64Data = data.substr(data.indexOf(',') + 1);

                fs.writeFileSync(fileName, base64Data, format, callback);
            }
            else {

                let link = document.createElement("a");
                link.download = fileName;
                link.href = data;
                link.click();
            }
        }
        else {

            fs.writeFileSync(fileName, data, format, callback);
        }
    }

    class Settings {

        data = {
            "activeSettingName": "setting1",
            "setting1": {
                "currentDirectoryPath": "./",
                "referenceDirectoryPath": "./test",
                "exportPath": "./",
                "maxLastUsedFilePaths": 5,
                "lastUsedFilePaths": ['./test/test01_app_demo.json']
            } as LocalSetting
        };

        load() {

            let text = fs.readFileSync('./test/settings.json');

            if (text) {

                let json = JSON.parse(text);

                if (json) {

                    this.data = json;
                }
            }
        }

        setItem(key: string, value: object) {

            this.data[key] = value;

            fs.writeFileSync('./test/settings.json', JSON.stringify(this.data));
        }

        getItem(key: string): any {

            return this.data[key];
        }
    };

    export let settings = new Settings();

    export let clipboard: any = supportsNative() ? require('electron').clipboard : {

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
