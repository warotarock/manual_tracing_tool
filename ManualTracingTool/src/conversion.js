// declarations for language conversion
var List = Array;
var Dictionary = Array;
function ListAddRange(destList, addList) {
    Array.prototype.push.apply(destList, addList);
}
function ListGetRange(srcList, index, length) {
    return srcList.slice(index, index + length);
}
function ListInsertAt(destList, index, item) {
    destList.splice(index, 0, item);
}
function ListRemoveAt(destList, index) {
    destList.splice(index, 1);
}
function ListClone(list) {
    return list.slice();
}
function DictionaryContainsKey(dic, key) {
    return (key in dic);
}
function StringIsNullOrEmpty(str) {
    return (str == null || str == undefined || str == "");
}
function StringIndexOf(str, searchString) {
    return str.indexOf(searchString);
}
function StringLastIndexOf(str, searchString) {
    return str.lastIndexOf(searchString);
}
function StringSubstring(text, startIndex, length) {
    return text.substr(startIndex, length);
}
function StringStartsWith(text, searchString) {
    return (text.indexOf(searchString) == 0);
}
function StringContains(text, searchString) {
    return (text.indexOf(searchString) != -1);
}
