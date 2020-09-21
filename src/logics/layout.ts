import { int, float } from '../base/conversion';
import { CanvasWindow } from '../renders/render2d';

export class RectangleLayoutArea {

  index = -1;
  iconID = -1;

  marginTop = 0.0;
  marginRight = 0.0;
  marginBottom = 0.0;
  marginLeft = 0.0;

  top = 0.0;
  right = 0.0;
  bottom = 0.0;
  left = 0.0;

  borderTop = 0.0;
  borderRight = 0.0;
  borderBottom = 0.0;
  borderLeft = 0.0;

  paddingTop = 0.0;
  paddingRight = 0.0;
  paddingBottom = 0.0;
  paddingLeft = 0.0;

  setIndex(index: int): RectangleLayoutArea {

    this.index = index;

    return this;
  }

  setIcon(index: int): RectangleLayoutArea {

    this.iconID = index;

    return this;
  }

  getWidth(): float {

    return (this.right - this.left + 1.0);
  }

  getHeight(): float {

    return (this.bottom - this.top + 1.0);
  }

  copyRectangle(canvasWindow: CanvasWindow) {

    this.left = 0.0;
    this.top = 0.0;
    this.right = canvasWindow.width - 1.0;
    this.bottom = canvasWindow.width - 1.0;
  }
}

export class LayoutLogic {

}
