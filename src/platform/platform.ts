import { int, ListRemoveAt, ListInsertAt, ListGetRange } from '../base/conversion';
import { LocalSetting, LocalSettingFileSection } from '../base/data';

var require = window['require'];

export module Platform {

  export function supportsNative(): boolean {

    return (typeof (require) != 'undefined');
  }

  export function getCurrentTime(): int {

    return performance.now();
  }

  const fs = supportsNative() ? require('fs')
  : {

    readFileSync(fileName: string): string {

      return window.localStorage.getItem(fileName);
    },

    writeFile(fileName: string, text: string) {

      window.localStorage.setItem(fileName, text);
    }
  };

  class Settings {

    data = {
      activeSettingName: "setting1",
      setting1: {
        currentDirectoryPath: "./",
        referenceDirectoryPath: "./test",
        exportPath: "./",
        maxLastUsedFilePaths: 5,
        lastUsedFilePaths: ['./test/test01_app_demo.json'],
        fileSections: []
      } as LocalSetting
    };

    load() {

      let text = fs.readFileSync('./test/settings.json');

      if (text) {

        let json = JSON.parse(text);

        if (json) {

          this.data = json;

          if (this.data.setting1.fileSections == undefined) {

            this.data.setting1.fileSections = [];
          }
        }
      }
    }

    save() {

      fs.writeFileSync('./test/settings.json', JSON.stringify(this.data));
    }

    setItem(key: string, value: object) {

      this.data[key] = value;

      this.save();
    }

    getItem(key: string): any {

      return this.data[key];
    }

    getOpenFileEnvitonments() {

      return {
        fileSections: this.data.setting1.fileSections,
        lastUsedFilePaths: this.data.setting1.lastUsedFilePaths
      }
    }

    addFileSection(fileSection: LocalSettingFileSection) {

      const new_FileSections = this.data.setting1.fileSections
        .filter(section => section.path != fileSection.path);

      new_FileSections.push(fileSection);

      this.saveFileSections(new_FileSections);
    }

    removeFileSection(fileSection: LocalSettingFileSection) {

      const new_FileSections = this.data.setting1.fileSections
        .filter(section => section != fileSection);

      this.saveFileSections(new_FileSections);
    }

    private saveFileSections(new_FileSections: LocalSettingFileSection[]) {

      let index = 0;
      new_FileSections.forEach(item => item.index = index++);

      this.data.setting1.fileSections = new_FileSections;

      this.save();
    }

    registerLastUsedFile(filePath: string) {

      let paths = this.data.setting1.lastUsedFilePaths;

      for (let index = 0; index < paths.length; index++) {

          if (paths[index] == filePath) {

              ListRemoveAt(paths, index);
          }
      }

      ListInsertAt(paths, 0, filePath);

      if (paths.length > this.data.setting1.maxLastUsedFilePaths) {

          paths = ListGetRange(paths, 0, this.data.setting1.maxLastUsedFilePaths);
      }

      this.data.setting1.lastUsedFilePaths = paths;
  }
  };

  export const settings = new Settings();

  export const path = supportsNative() ? require('path')
  : {

    basename(path: string) {

      return path;
    }
  };

  const electron = supportsNative() ? require('electron') : null;

  export const clipboard: any = electron ? electron.clipboard
  : {

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

  export const fileSystem = {

    writeFileSync(fileName: string, data: any, format: 'base64' | 'utf8', callback: Function) {

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
    },

    getFilesSync(directoryPath: string) {

      const dirents: any[] = fs.readdirSync(directoryPath, { withFileTypes: true });

      const files = dirents
        .filter(dirent => dirent.isFile())
        .map(dirent => ({
          name: path.basename(dirent.name),
          path: path.join(directoryPath, dirent.name)
        }));

      return files;
    },

    async selectDirectory(defaultPath: string) {

      const openDialogResult = await electron.ipcRenderer.invoke('select-file-place-folder', defaultPath);

      if (openDialogResult.filePaths && openDialogResult.filePaths.length > 0) {

        return openDialogResult.filePaths[0];
      }
      else {

        return null;
      }
    },
  };
}
