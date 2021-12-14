import { Posing3DModelLogic } from '../posing3d/posing3d_model'
import { ImageResource, ModelFile, ModelResource } from '../posing3d/posing3d_view'
import { WebGLRender } from '../render/render3d'

export class ResourceLoader {

  posing3DViewRender: WebGLRender = null
  posing3DModel: Posing3DModelLogic = null

  startLoadingModelFile(modelFile: ModelFile, url: string) {

    const xhr = new XMLHttpRequest()
    xhr.open('GET', url)
    xhr.responseType = 'json'

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

    xhr.send()
  }

  startLoadingImageResource(imageResource: ImageResource, url: string) {

    const image = new Image()

    imageResource.image.imageData = image

    image.addEventListener('load',
      () => {

        if (imageResource.isGLTexture) {

          this.posing3DViewRender.initializeImageTexture(imageResource.image)
        }

        imageResource.image.width = image.width
        imageResource.image.height = image.height

        imageResource.loaded = true
      }
    )

    image.src = url
  }
}
