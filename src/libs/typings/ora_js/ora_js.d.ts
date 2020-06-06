// written by @warotarock

declare namespace ora {

    var scriptsPath: string;
    var blending: boolean;
    var enableWorkers: boolean;

    class OraLayer {

        image: HTMLImageElement | HTMLCanvasElement;

        visibility: 'visible' | 'hidden';
        x: number;
        y: number;
        opacity: number;
        composite: 'svg:src-over' | 'svg:multiply';
    }

    class Ora {

        constructor(width: number, height: number);

        addLayer(name: string, index: number): OraLayer;

        save(jsonTextFileName: string, jsonText: string, ondone: (base64Data: string) => void);
    }
}

declare namespace zip {

    var workerScriptsPath: string;

    namespace fs {

        class ZipEntry {

            name: string;
            directory: string;
            children: ZipEntry[];
            id: number;

            getText(caallback: (text: string) => void): void;
            getData64URI(mimeType: string, callback: (uri: string) => void, checkCrc32?: boolean): string;
        }

        class FS {

            find(path: string): ZipEntry;
            importBlob(blob: Blob, callback: () => void);
        }
    }
}
