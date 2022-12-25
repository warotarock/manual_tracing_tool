import { Platform } from './platform'

export interface UserStorageData {

  version: string
}

export class UserStorage {

  static readonly userDataFilePath = 'user-data.json'

  static data: UserStorageData = {
    version: '0.0.0'
  }

  static async load(defaultData: UserStorageData) {

    try {

      const text = await Platform.fileSystem.readUserDataFile(this.userDataFilePath)

      if (text == '' || text == null) {
        throw new Error('ERROR 0061:User data does not exists.')
      }

      this.data = JSON.parse(text)

      console.log('UserStrageData is loaded from native file.')
    }
    catch(e) {

      this.data = defaultData

      console.log('UserStrageData is initialized by default.', e)
    }
  }

  static save() {

    Platform.fileSystem.writeUserDataFile(this.userDataFilePath, JSON.stringify(this.data))
      .then()
  }

  static setItem<T>(key: string, value: T) {

    this.data[key] = value

    this.save()
  }

  static getItem<T>(key: string): T | null {

    if (key in this.data) {

      return JSON.parse(JSON.stringify(this.data[key]))
    }
    else {

      return null
    }
  }
}
