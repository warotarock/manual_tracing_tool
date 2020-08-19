
export var List = Array;
export var Dictionary = Array;

export type List<T> = Array<T>;
export type Dictionary<T> = any | Array<T>;

export type uchar = number;
export type char = number;
export type short = number;
export type int = number;
export type long = number;
export type uint = number;
export type ulong = number;
export type ushort = number;
export type float = number;

export type stringvalue = string;
export type wchar = string;
export type wstring = string;
export type wstringvalue = string;

export function ListAddRange<T>(destList: List<T>, addList: List<T>) {
    Array.prototype.push.apply(destList, addList);
}

export function ListGetRange<T>(srcList: List<T>, index: int, length: int): List<T> {
    return srcList.slice(index, index + length);
}

export function ListGetRangeToLast<T>(srcList: List<T>, index: int): List<T> {
    return srcList.slice(index, srcList.length);
}

export function ListInsertAt<T>(destList: List<T>, index: int, item: T) {
    destList.splice(index, 0, item);
}

export function ListRemoveAt<T>(destList: List<T>, index: int) {
    destList.splice(index, 1);
}

export function ListClone<T>(list: List<T>): List<T> {
    return list.slice();
}

export function ListReverse<T>(list: List<T>): List<T> {
    return list.reverse();
}

export function DictionaryContainsKey<T>(dic: Dictionary<T>, key: string): boolean {
    return (key in dic);
}

export function StringIsNullOrEmpty(str: string): boolean {
    return (str == null || str == undefined || str == "");
}

export function StringIndexOf(str: string, searchString): int {
    return str.indexOf(searchString);
}

export function StringLastIndexOf(str: string, searchString): int {
    return str.lastIndexOf(searchString);
}

export function StringSubstring(text: string, startIndex: int, length: int): string {
    return text.substr(startIndex, length);
}

export function StringStartsWith(text: string, searchString: string): boolean {
    return (text.indexOf(searchString) == 0);
}

export function StringEndsWith(text: string, searchString: string): boolean {
    return (text.indexOf(searchString) == (text.length - searchString.length));
}

export function StringContains(text: string, searchString: string): boolean {
    return (text.indexOf(searchString) != -1);
}
