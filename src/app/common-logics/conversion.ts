
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

  static insertRangeToTop<T>(destList: T[], addList: T[]): T[] {

    return [...addList, ...destList]
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

  static cloneReversed<T>(list: T[]): T[] {

    return Lists.clone(list).reverse()
  }
}

export class Strings {

  static isNullOrEmpty(str: string): boolean {

    return (str === null || str === undefined || str === "")
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

  static substring(text: string, startIndex: int, length?: int): string {

    if (length) {

      if (length > 0) {

        if (length >= text.length) {
          return ''
        }

        return text.substring(startIndex, startIndex + length)
      }
      else if (length < 0) {

        if (-length >= text.length) {
          return ''
        }

        return text.substring(startIndex, text.length - 1 + length)
      }
      else {

        return ''
      }
    }
    else {

      return text.substring(startIndex)
    }
  }

  static startsWith(text: string, searchString: string): boolean {

    return (text.indexOf(searchString) == 0)
  }

  static endsWith(text: string, searchString: string): boolean {

    return (text.lastIndexOf(searchString) == (text.length - searchString.length))
  }

  static contains(text: string, searchString: string): boolean {

    return (text.indexOf(searchString) != -1)
  }

  static replaceAll(text: string, removeString: string, replaceString): string {

    return text.replace(new RegExp(removeString, 'g'), replaceString)
  }
}
