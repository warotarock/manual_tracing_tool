import { Posing3DModelLogic, ImageResource, ModelFile  } from '../posing3d'
import { WebGLRender } from '../render'
import { ResourceLoader } from './resource-loader'

export class SystemResourceLoading {

  resourceLoader = new ResourceLoader()

  loading_ModelFiles: ModelFile[] = []
  loading_ImageResurces: ImageResource[] = []

  link(render: WebGLRender, posing3DModel: Posing3DModelLogic) {

    this.resourceLoader.posing3DModel = posing3DModel
    this.resourceLoader.posing3DViewRender = render
  }

  startLoadingSystemResources(modelFile: ModelFile, imageResurces: ImageResource[]) {

    this.loading_ModelFiles = []

    this.resourceLoader.startLoadingModelFile(modelFile, './res/' + modelFile.fileName)
    this.loading_ModelFiles.push(modelFile)

    this.loading_ImageResurces = []

    for (const imageResource of imageResurces) {

      this.resourceLoader.startLoadingImageResource(imageResource, imageResource.filePath, '')

      this.loading_ImageResurces.push(imageResource)
    }
  }

  isLoading(): boolean {

    if (this.loading_ModelFiles.find(item => item.loaded == false && item.error == false)) {
      return true
    }

    if (this.loading_ImageResurces.find(item => item.loaded == false && item.error == false)) {
      return true
    }

    return false
  }
}
