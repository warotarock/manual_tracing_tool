import { Platform } from '../../platform'
import { ImageResource, ModelFile, ModelResource, Posing3DModelLogic } from '../posing3d'
import { WebGLRender } from '../render'

export class ResourceLoader {

  posing3DViewRender: WebGLRender = null
  posing3DModel: Posing3DModelLogic = null

  startLoadingModelFile(modelFile: ModelFile, url: string) {

    const xhr = new XMLHttpRequest()
    xhr.open('GET', url)
    xhr.responseType = 'json'

    modelFile.loaded = false
    modelFile.error = false

    xhr.addEventListener('load',
      () => {

        let data: { static_models, skin_models }

        if (xhr.responseType == 'json') {
          data = xhr.response
        }
        else {
          data = JSON.parse(xhr.response)
        }

        for (const modelData of data.static_models) {

          const modelResource = new ModelResource()
          modelResource.modelName = modelData.name

          this.posing3DViewRender.initializeModelBuffer(modelResource.model, modelData.vertices, modelData.indices, 4 * modelData.vertexStride) // 4 = size of float

          modelFile.modelResources.push(modelResource)
          modelFile.modelResourceDictionary.set(modelData.name,  modelResource)
        }

        for (const modelData of data.skin_models) {

          modelFile.posingModelDictionary.set(modelData.name, this.posing3DModel.createPosingModel(modelData))
        }

        modelFile.loaded = true
      }
    )

    xhr.addEventListener('load',
      () => {

        modelFile.error = true
      }
    )

    xhr.send()
  }

  startLoadingImageResource(imageResource: ImageResource, filePath: string, basePath: string) {

    const image = new Image()

    imageResource.loaded = false
    imageResource.error = false

    if (basePath.length > 0 && Platform.path.isRelativePath(filePath)) {

      const refFileBasePath = Platform.path.getDirectoryPath(basePath)

      const absPath = Platform.path.resolveRelativePath(refFileBasePath, filePath)

      imageResource.filePath = Platform.path.getPlatformOrientedPath(absPath)
    }
    else {

      imageResource.filePath = filePath
    }

    image.addEventListener('load',
      () => {

        // TODO: WebGLテクスチャの開放処理

        imageResource.image.imageData = image

        if (imageResource.isGLTexture) {

          this.posing3DViewRender.initializeImageTexture(imageResource.image)
        }

        imageResource.image.width = image.width
        imageResource.image.height = image.height
        imageResource.loaded = true
      }
    )

    image.addEventListener('error',
      () => {

        console.log(new Error('ERROR-0000: Error has occured while loading and image'), imageResource.filePath)

        imageResource.error = true
      }
    )

    image.src = imageResource.filePath
  }
}
