import { Posing3DModelLogic } from '../posing3d/posing3d_model'
import { ImageResource, ModelFile } from '../posing3d/posing3d_view'
import { WebGLRender } from '../render/render3d'
import { ResourceLoader } from './resource_loader'

export class LoadingSystemResourceLogic {

  resourceLoader = new ResourceLoader()

  loading_ModelFiles: ModelFile[] = []
  loading_ImageResurces: ImageResource[] = []

  link(render: WebGLRender, posing3DModel: Posing3DModelLogic) {

    this.resourceLoader.posing3DModel = posing3DModel
    this.resourceLoader.posing3DViewRender = render
  }

  startLoadingSystemResources(modelFile: ModelFile, imageResurces: ImageResource[]) {

    this.loading_ModelFiles = []

    this.resourceLoader.startLoadingModelFile(modelFile, './dist/res/' + modelFile.fileName)
    this.loading_ModelFiles.push(modelFile)

    this.loading_ImageResurces = []

    for (const imageResource of imageResurces) {

      this.resourceLoader.startLoadingImageResource(imageResource, './dist/res/' + imageResource.fileName)

      this.loading_ImageResurces.push(imageResource)
    }
  }

  isLoading(): boolean {

    if (this.loading_ModelFiles.find(item => item.loaded == false)) {
      return true
    }

    if (this.loading_ImageResurces.find(item => item.loaded == false)) {
      return true
    }

    return false
  }
}
