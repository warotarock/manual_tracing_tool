
export class LocalSetting {

  currentDirectoryPath: string = null
  referenceDirectoryPath: string = ''
  exportPath: string = null
  lastUsedFilePaths: string[] = []
  maxLastUsedFilePaths = 5
  fileSections: LocalSettingFileSection[] = []
}

export class LocalSettingFileSection {

  index = 0
  name = ''
  path = ''
}
