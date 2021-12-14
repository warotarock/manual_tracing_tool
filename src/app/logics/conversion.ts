
export type int = number
export type float = number

export class Lists {

  static addRange<T>(destList: T[], addList: T[]) {

    Array.prototype.push.apply(destList, addList)
  }

  static getRange<T>(srcList: T[], index: int, length: int): T[] {

    return srcList.slice(index, index + length)
  }

  static getRangeToLast<T>(srcList: T[], index: int): T[] {

    return srcList.slice(index, srcList.length)
  }

  static insertAt<T>(destList: T[], index: int, item: T) {

    destList.splice(index, 0, item)
  }

  static removeAt<T>(destList: T[], index: int) {

    destList.splice(index, 1)
  }

  static clone<T>(list: T[]): T[] {

    return list.slice()
  }

  static reverse<T>(list: T[]): T[] {

    return list.reverse()
  }
}

export class Strings {

  static isNullOrEmpty(str: string): boolean {

    return (str == null || str == undefined || str == "")
  }

  static indexOf(str: string, searchString: string, startPosition?: int): int {

    if (startPosition == -1) {

      startPosition = undefined
    }

    return str.indexOf(searchString, startPosition)
  }

  static lastIndexOf(str: string, searchString: string): int {

    return str.lastIndexOf(searchString)
  }

  static substring(text: string, startIndex: int, length: int): string {

    return text.substr(startIndex, length)
  }

  static startsWith(text: string, searchString: string): boolean {

    return (text.indexOf(searchString) == 0)
  }

  static endsWith(text: string, searchString: string): boolean {

    return (text.indexOf(searchString) == (text.length - searchString.length))
  }

  static contains(text: string, searchString: string): boolean {

    return (text.indexOf(searchString) != -1)
  }
}
