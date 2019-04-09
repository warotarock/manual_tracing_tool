
// declarations for language conversion
var List = Array;
var Dictionary = Array;

type List<T> = Array<T>;
type Dictionary<T> = any | Array<T>;

type uchar = number;
type char = number;
type short = number;
type int = number;
type long = number;
type uint = number;
type ulong = number;
type ushort = number;
type float = number;

type stringvalue = string;
type wchar = string;
type wstring = string;
type wstringvalue = string;

function ListAddRange<T>(destList: List<T>, addList: List<T>) {
    Array.prototype.push.apply(destList, addList);
}

function ListGetRange<T>(srcList: List<T>, index: int, length: int): List<T> {
    return srcList.slice(index, index + length);
}

function ListGetRangeToLast<T>(srcList: List<T>, index: int): List<T> {
    return srcList.slice(index, srcList.length);
}

function ListInsertAt<T>(destList: List<T>, index: int, item: T) {
    destList.splice(index, 0, item);
}

function ListRemoveAt<T>(destList: List<T>, index: int) {
    destList.splice(index, 1);
}

function ListClone<T>(list: List<T>): List<T> {
    return list.slice();
}

function DictionaryContainsKey<T>(dic: Dictionary<T>, key: string): boolean {
    return (key in dic);
}

function StringIsNullOrEmpty(str: string): boolean {
    return (str == null || str == undefined || str == "");
}

function StringIndexOf(str: string, searchString): int {
    return str.indexOf(searchString);
}

function StringLastIndexOf(str: string, searchString): int {
    return str.lastIndexOf(searchString);
}

function StringSubstring(text: string, startIndex: int, length: int): string {
    return text.substr(startIndex, length);
}

function StringStartsWith(text: string, searchString: string): boolean {
    return (text.indexOf(searchString) == 0);
}

function StringContains(text: string, searchString: string): boolean {
    return (text.indexOf(searchString) != -1);
}