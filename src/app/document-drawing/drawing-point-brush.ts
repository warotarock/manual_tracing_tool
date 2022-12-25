import { float, int, Logic_Points } from '../common-logics'
import { VectorLayerGeometry, VectorPoint, VectorStroke } from '../document-data'
import { VectorPointLogic } from '../document-logic'
import { CanvasRender, CanvasRenderBlendMode } from '../render'
import { ViewKeyframeLayer } from '../view'
import { DrawPathRenderCache, DrawPathRenderMaskData, DrawPathRenderMaskImageData } from './draw-path-render-cache'
import { ToolDrawingStyle } from "./drawing-style"

class OcclusionMap {

  data = new Float32Array(2000)
  mapLength: int = 0

  clear() {

    this.data.fill(0.0, 0, this.mapLength)
  }
}

export class DrawingPointBrushLogic {

  private drawStyle: ToolDrawingStyle = null

  private occlusionMap = new OcclusionMap()

  private local_Mat = mat4.create()
  private local_center = vec2.create()

  link(drawStyle: ToolDrawingStyle) {

    this.drawStyle = drawStyle
  }

  drawPointBrushStroke(render: CanvasRender, stroke: VectorStroke, color: Vec4, useAdjustingLocation: boolean, renderCache: DrawPathRenderCache) {

    const gradient = render.createRadialGradient(0.0, 0.0, 1.0);
    gradient.addColorStop(0.0, this.getRGBAText(color, 1.0));
    gradient.addColorStop(1.0, this.getRGBAText(color, 0.0));
    render.setFillGradiaent(gradient);

    mat4.identity(this.local_Mat)

    for (const point of stroke.points) {

      const lengthFrom = (useAdjustingLocation ? point.adjustingLengthFrom : 1.0)
      const lengthTo = (useAdjustingLocation ? point.adjustingLengthTo : 0.0)

      if (lengthFrom <= 0.0 && lengthTo >= 1.0) {
        continue
      }

      const location = this.getPointLocation(point, useAdjustingLocation)
      const radius = VectorPointLogic.getPointRadius(point)

      this.local_Mat[0] = radius
      this.local_Mat[5] = radius
      this.local_Mat[12] = location[0]
      this.local_Mat[13] = location[1]

      render.setLocalTransform(this.local_Mat)

      render.fillRect(-1.0, -1.0, 2.0, 2.0)

      if (renderCache != null) {

        this.collectOcclusionMap(this.occlusionMap, location, radius, 2, renderCache)

        this.setMaskForBrushShape(renderCache, location, radius, this.occlusionMap)
      }
    }
  }

  private getPointLocation(point: VectorPoint, useAdjustingLocation: boolean): Vec3 {

    return (useAdjustingLocation ? point.adjustingLocation : point.location)
  }

  private getRGBAText(color: Vec4, alpha: float): string {

    const r = color[0] * 255
    const g = color[1] * 255
    const b = color[2] * 255
    const a = color[3] * alpha

    return `rgba(${r.toFixed(0)},${g.toFixed(0)},${b.toFixed(0)},${a.toFixed(3)})`
  }

  private collectOcclusionMap(occlusionMap: OcclusionMap, center_location: Vec3, radius: float, division: number, renderCache: DrawPathRenderCache) {

    const occlusionMapLength = Math.floor(radius * 2 * Math.PI / division)
    const occlusionMap_unitAngle = Math.PI * 2 / occlusionMapLength

    if (occlusionMap.data.length < occlusionMapLength) {

      occlusionMap.data = new Float32Array(occlusionMapLength)
    }

    occlusionMap.mapLength = occlusionMapLength
    occlusionMap.clear()

    const map_data = occlusionMap.data
    const minDistanceSQ = radius * radius
    const segmentMatrix = mat2d.create()

    // Collects intersected segements
    const intersected_segments: { from_point: VectorPoint, to_point: VectorPoint, length: float, angle: float, invMat: Mat2d }[] = []

    for (const geometry of renderCache.relatedData.geometries) {

      if (!geometry.runtime.area.hittestLocationWithRadius(center_location, radius)) {
        continue
      }

      VectorLayerGeometry.forEachStroke(geometry, (stroke) => {

        if (stroke.runtime.area.hittestLocationWithRadius(center_location, radius)) {

          for (let index = 0; index < stroke.points.length - 1; index++) {

            const from_point = stroke.points[index]
            const to_point = stroke.points[index + 1]

            const distanceSQ = Logic_Points.pointToLineSegment_SorroundingDistanceSQ(
              from_point.location,
              to_point.location,
              center_location
            )

            if (distanceSQ <= minDistanceSQ) {

              const dx = to_point.location[0] - from_point.location[0]
              const dy = to_point.location[1] - from_point.location[1]
              const segment_length = Math.sqrt(dx * dx + dy * dy)

              if (segment_length == 0.0) {
                continue
              }

              const nx = dx / segment_length
              const ny = dy / segment_length
              const angle = this.atan2Rounded(ny, nx)

              segmentMatrix[0] = Math.cos(angle)
              segmentMatrix[1] = -Math.sin(angle)
              segmentMatrix[2] = Math.sin(angle)
              segmentMatrix[3] = Math.cos(angle)
              segmentMatrix[4] = from_point.location[0]
              segmentMatrix[5] = from_point.location[1]

              const invMat = [
                segmentMatrix[0],
                segmentMatrix[2],
                segmentMatrix[1],
                segmentMatrix[3],
                -(segmentMatrix[4] * segmentMatrix[0] + segmentMatrix[5] * segmentMatrix[1]),
                -(segmentMatrix[4] * segmentMatrix[2] + segmentMatrix[5] * segmentMatrix[3])
              ]

              intersected_segments.push({ from_point: from_point, to_point: to_point, length: segment_length, angle: angle, invMat: invMat })
            }
          }
        }
      })
    }

    let loopCount = 0

    for (const segement of intersected_segments) {

      // Gets segment-local location
      this.traslateMat2d(this.local_center, center_location, segement.invMat)

      if (Math.abs(this.local_center[1]) >= radius) {
        continue
      }

      // Calculate locations and angles of two intersection points for the segment and the blush location
      const dy = -this.local_center[1]
      const dx = Math.sqrt(radius * radius - dy * dy)

      let left_intersect_locationX = this.local_center[0] - dx
      if (left_intersect_locationX < 0.0) {
        left_intersect_locationX = 0.0
      }

      const local_leftSideAngle = this.atan2Rounded(dy, left_intersect_locationX - this.local_center[0])
      const world_leftSideAngle = this.roundAngle(segement.angle + local_leftSideAngle)

      let right_intersect_locationX = this.local_center[0] + dx
      if (right_intersect_locationX > segement.length) {
        right_intersect_locationX = segement.length
      }

      const local_rightSideAngle = this.atan2Rounded(dy, right_intersect_locationX - this.local_center[0])

      // Determine ranges to calculation
      const angleDistance = local_rightSideAngle - local_leftSideAngle

      const angleAdvanceDirection = Math.sign(angleDistance)

      let angleDistanceRouded = Math.abs(angleDistance)
      if (angleDistanceRouded >= Math.PI) {
        angleDistanceRouded -= Math.PI
      }

      const max_angleIndexCount = Math.abs(Math.floor(angleDistanceRouded / occlusionMap_unitAngle)) + 1

      // Set mask value for each angle
      const offset_y = -this.local_center[1]
      const scan_unitAngle = occlusionMap_unitAngle * angleAdvanceDirection
      let angleIndex = Math.floor(world_leftSideAngle / occlusionMap_unitAngle)
      for (let angleIndexCount = 0; angleIndexCount < max_angleIndexCount; angleIndexCount++) {

        const angle = local_leftSideAngle + angleIndexCount * scan_unitAngle

        // angleで傾きが決まる直線とy=0との交点を計算します。式を整理するとtanを使った式で計算できます。
        // const angle_dx = Math.cos(angle) * radius
        // const angle_dy = -Math.sin(angle) * radius
        // const offset_x = angle_dx / angle_dy * offset_y
        const offset_x = offset_y / Math.tan(angle)

        const distanceSq = offset_x * offset_x + offset_y * offset_y

        const existing_distanceSq = map_data[angleIndex]
        if (existing_distanceSq == 0.0 || existing_distanceSq > distanceSq) {

          map_data[angleIndex] = distanceSq
        }

        angleIndex += angleAdvanceDirection
        if (angleIndex >= occlusionMapLength) {
          angleIndex = 0
        }
        else if (angleIndex < 0) {
          angleIndex += occlusionMapLength
        }

        loopCount++
      }
    }

    // console.log(radius, intersected_segments.length, occlusionMapLength, loopCount)
  }

  private atan2Rounded(y, x) {

    let angle = Math.atan2(-y, x)

    if (angle < 0.0) {
      angle += Math.PI * 2
    }

    return this.roundAngle(angle)
  }

  private roundAngle(angle) {

    if (angle < 0.0) {
      angle += Math.PI * 2
    }

    if (angle >= Math.PI * 2) {
      angle -= Math.PI * 2
    }

    return angle
  }

  private traslateMat2d(result: Vec2, target: Vec3, mat2d: Mat2d) {

    const x = target[0]
    const y = target[1]

    result[0] = x * mat2d[0] + y * mat2d[2] + mat2d[4]
    result[1] = x * mat2d[1] + y * mat2d[3] + mat2d[5]
  }

  private setMaskForBrushShape(renderCache: DrawPathRenderCache, center_location: Vec3, radius: float, occlusionMap: OcclusionMap) {

    const mask_array = renderCache.maskData.data
    const pixelBytes = renderCache.maskData.pixelBytes
    const lineBytes = renderCache.maskData.lineBytes

    const center_x = center_location[0] - renderCache.location[0]
    const center_y = center_location[1] - renderCache.location[1]

    const bound_radius = Math.floor(radius + 1.0)
    const pixel_center_left = Math.floor(center_x - bound_radius)
    const pixel_center_right = Math.floor(center_x + bound_radius)
    const pixel_center_top = Math.floor(center_y - bound_radius)
    const pixel_center_bottom = Math.floor(center_y + bound_radius)
    const minX = Math.min(Math.max(pixel_center_left, 0), renderCache.width - 2)
    const minY = Math.min(Math.max(pixel_center_top, 0), renderCache.height - 2)
    const maxX = Math.min(Math.max(pixel_center_right, 0), renderCache.width - 2)
    const maxY = Math.min(Math.max(pixel_center_bottom, 0), renderCache.height - 2)

    const radiusSq = bound_radius * bound_radius
    const pixel_centering_offset = 0.5

    for (let y = minY; y <= maxY; y++) {

      let mask_offset = y * lineBytes + minX * pixelBytes

      for (let x = minX; x <= maxX; x++) {

        if (mask_array[mask_offset] != 0) {
          mask_offset += pixelBytes
          continue
        }

        const dx = x + pixel_centering_offset - center_x
        const dy = y + pixel_centering_offset - center_y
        const distance = dx * dx + dy * dy

        let angle = Math.atan2(-dy, dx)
        if (angle < 0) {
          angle = Math.PI * 2 + angle
        }
        const angleIndex = Math.floor(angle / Math.PI / 2 * occlusionMap.mapLength)

        const occlusion_distance = occlusionMap.data[angleIndex]

        if (distance <= radiusSq && (occlusion_distance == 0 || distance <= occlusion_distance)) {
          mask_array[mask_offset] = 1
        }

        // mask_array[mask_offset] = 1
        mask_offset += pixelBytes
      }
    }
  }

  drawRenderResult(render: CanvasRender, renderCache: DrawPathRenderCache) {

    this.setMaskImageToImageData(renderCache.maskImageData, renderCache.maskData, [255, 255, 0, 255])

    render.setBlendMode(CanvasRenderBlendMode.destinationIn)

    render.resetTransform()
    render.drawImage(
      renderCache.maskImageData.canvasWindow.canvas,
      0, 0,
      renderCache.maskImageData.canvasWindow.width, renderCache.maskImageData.canvasWindow.height,
      0, 0,
      renderCache.maskImageData.canvasWindow.width, renderCache.maskImageData.canvasWindow.height,
    )

    render.setBlendMode(CanvasRenderBlendMode.default)

    // DEBUG
    // render.putImageData(renderCache.maskImageData.imageData, 0, 0)

    // DEBUG
    // render.setStrokeWidth(render.getViewScaledSize(1.0))
    // render.beginPath()
    // render.moveTo(0.0, 0.0)
    // render.lineTo(renderCache.width - 1, 0.0)
    // render.lineTo(renderCache.width - 1.0, renderCache.height - 1.0)
    // render.lineTo(0.0, renderCache.height - 1.0)
    // render.lineTo(0.0, 0.0)
    // render.stroke()
  }

  private setMaskImageToImageData(maskImageData: DrawPathRenderMaskImageData, maskData: DrawPathRenderMaskData, color: Vec4) {

    const image_array = maskImageData.imageData.data
    const mask_data = maskData.data

    for (let y = 0; y < maskData.height; y++) {

      let iamge_offset = y * maskImageData.lineBytes
      let mask_offset = y * maskData.lineBytes

      for (let x = 0; x < maskData.width; x++) {

        if (mask_data[mask_offset] != 0) {

          image_array[iamge_offset] = color[0]
          image_array[iamge_offset + 1] = color[1]
          image_array[iamge_offset + 2] = color[2]
          image_array[iamge_offset + 3] = color[3]
        }
        else {

          image_array[iamge_offset] = 0
          image_array[iamge_offset + 1] = 0
          image_array[iamge_offset + 2] = 0
          image_array[iamge_offset + 3] = 0
        }

        iamge_offset += maskImageData.pixelBytes
        mask_offset += maskData.pixelBytes
      }
    }

    maskImageData.canvasWindow.context.putImageData(maskImageData.imageData, 0, 0)
  }
}
