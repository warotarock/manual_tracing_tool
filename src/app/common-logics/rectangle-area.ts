import { float } from '../common-logics'

export class RectangleArea {

  static INFINIT_POSITION_VALUE = 999999.0
  static MINIMUM_POSITION_VALUE = 0.0001

  top = 0.0
  right = 0.0
  bottom = 0.0
  left = 0.0
  range = 0.0
  centerLocation = vec3.fromValues(0.0, 0.0, 0.0)

  static createMinumumValueRectangle(): RectangleArea {

    return (new RectangleArea()).setMinimumValue()
  }

  static calculateSurroundingRectangle(result: RectangleArea, rectangle1: RectangleArea, rectangle2: RectangleArea) {

    result.left = Math.min(rectangle1.left, rectangle2.left)
    result.top = Math.min(rectangle1.top, rectangle2.top)
    result.right = Math.max(rectangle1.right, rectangle2.right)
    result.bottom = Math.max(rectangle1.bottom, rectangle2.bottom)
  }

  copyTo(destination: RectangleArea) {

    destination.top = this.top
    destination.right = this.right
    destination.bottom = this.bottom
    destination.left = this.left
    destination.range = this.range
    vec3.copy(destination.centerLocation, this.centerLocation)
  }

  calculateParams() {

    vec3.set(this.centerLocation,
      this.left + this.getWidth() / 2.0,
      this.top + this.getHeight() / 2.0,
      0.0
    )

    this.range = Math.sqrt(Math.pow(this.getWidth() / 2.0, 2) + Math.pow(this.getHeight() / 2.0, 2))
  }

  getWidth(): float {

    return Math.abs(this.right - this.left)
  }

  getHeight(): float {

    return Math.abs(this.bottom - this.top)
  }

  getBitmapWidth(): float {

    return Math.floor(this.getWidth() + 0.5)
  }

  getBitmapHeight(): float {

    return Math.floor(this.getHeight() + 0.5)
  }

  getMedianHrizontalPosition(): float {

    return this.left + this.getHeight() / 2
  }

  getMedianVerticalPosition(): float {

    return this.top + this.getHeight() / 2
  }

  getHorizontalPositionRate(x: float) {

    const width = this.getWidth()

    if (width == 0.0) {

      return 0.0
    }

    return (x - this.left) / width
  }

  getVerticalPositionRate(y: float) {

    const height = this.getHeight()

    if (height == 0.0) {

      return 0.0
    }

    return (y - this.top) / height
  }

  setMinimumValue(): RectangleArea {

    this.left = RectangleArea.INFINIT_POSITION_VALUE
    this.top = RectangleArea.INFINIT_POSITION_VALUE
    this.right = -RectangleArea.INFINIT_POSITION_VALUE
    this.bottom = -RectangleArea.INFINIT_POSITION_VALUE

    return this
  }

  isValidArea(): boolean {

    return (this.left != RectangleArea.INFINIT_POSITION_VALUE
      && this.top != RectangleArea.INFINIT_POSITION_VALUE
      && this.right != -RectangleArea.INFINIT_POSITION_VALUE
      && this.bottom != -RectangleArea.INFINIT_POSITION_VALUE)
  }

  existsValidArea(): boolean {

    return (this.isValidArea()
      && this.getBitmapWidth() > RectangleArea.MINIMUM_POSITION_VALUE
      && this.getBitmapHeight() > RectangleArea.MINIMUM_POSITION_VALUE)
  }

  expandByLocation(x: float, y: float) {

    this.left = Math.min(x, this.left)
    this.top = Math.min(y, this.top)

    this.right = Math.max(x, this.right)
    this.bottom = Math.max(y, this.bottom)
  }

  expandByRectangle(rectangle: RectangleArea) {

    RectangleArea.calculateSurroundingRectangle(this, this, rectangle)
  }

  hittestLocationWithRadius(location: Vec3, radius: float): boolean {

    return (
      location[0] >= this.left - radius
      && location[0] <= this.right + radius
      && location[1] >= this.top - radius
      && location[1] <= this.bottom + radius
    )
  }
}

