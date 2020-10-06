import { int, float, List } from '../base/conversion';
import { CanvasWindow } from '../renders/render2d';

export class RectangleLayoutArea {

  index = -1;
  iconID = -1;

  marginTop = 0.0;
  marginRight = 0.0;
  marginBottom = 0.0;
  marginLeft = 0.0;

  paddingTop = 0.0;
  paddingRight = 0.0;
  paddingBottom = 0.0;
  paddingLeft = 0.0;

  colSpan = 1;
  rowSpan = 1;

  width = 0.0;
  height = 0.0;

  top = 0.0;
  right = 0.0;
  bottom = 0.0;
  left = 0.0;

  children: RectangleLayoutArea[] = [];

  hover = false;
  hover_before = false;

  constructor(children?: RectangleLayoutArea[]) {

    if (children) {

      this.children = children;
    }
  }

  setChildren(children: RectangleLayoutArea[]): RectangleLayoutArea {

    this.children = children;

    return this;
  }

  setIndex(index: int): RectangleLayoutArea {

    this.index = index;

    return this;
  }

  setIcon(index: int): RectangleLayoutArea {

    this.iconID = index;

    return this;
  }

  setPadding({left, top, right, bottom}: { left?: float, top?: float, right?: float, bottom?: float }): RectangleLayoutArea {

    if (left) {
      this.paddingLeft = left;
    }

    if (top) {
      this.paddingTop = top;
    }

    if (right) {
      this.paddingRight = right;
    }

    if (bottom) {
      this.paddingBottom = bottom;
    }

    return this;
  }

  setCellSpan(colSpan: number, rowSpan: number): RectangleLayoutArea {

    this.colSpan = colSpan;
    this.rowSpan = rowSpan;

    return this;
  }

  getWidth(): float {

    return (this.right - this.left + 1.0);
  }

  getHeight(): float {

    return (this.bottom - this.top + 1.0);
  }

  saveState() {

    this.hover_before = this.hover;
  }

  isChanged(): boolean {

    return (this.hover_before != this.hover);
  }

  copyRectangle(canvasWindow: CanvasWindow) {

    this.left = 0.0;
    this.top = 0.0;
    this.right = canvasWindow.width - 1.0;
    this.bottom = canvasWindow.width - 1.0;
  }
}

interface GridLayoutCell {

  layoutArea: RectangleLayoutArea;
  left: float;
  top: float;
  right: float;
  bottom: float;
}

export class LayoutLogic {

  static calculateSize(layoutAreas: RectangleLayoutArea[]) {

    for (const layoutArea of layoutAreas) {

      this.calculateSize_Recursive(layoutArea);
    }
  }

  static calculateSize_Recursive(layoutArea: RectangleLayoutArea) {

  }

  static gridLayout(layoutArea: RectangleLayoutArea, options: { columns?: int, columnGap?: float, rows?: int, rowGap?: float }) {

    if (layoutArea.children.length == 0) {
      return;
    }

    const style = {
      ...{
        columns: 1,
        columnGap: 0,
        rows: 1,
        rowGap: 0
      },
      ...options
    };

    let left = layoutArea.left + layoutArea.paddingLeft;
    let right = layoutArea.right - layoutArea.paddingRight;

    let top = layoutArea.top + layoutArea.paddingTop;
    let bottom = layoutArea.bottom - layoutArea.paddingBottom;

    const columnGaps = (style.columns - 1) * style.columnGap;
    const cellWidth = ((right - left) - columnGaps) / style.columns;

    const rowGaps = (style.columns - 1) * style.columnGap;
    const cellHeight = ((bottom - top) - rowGaps) / style.rows;

    const cells: GridLayoutCell[][] = [];
    let y = top;
    for (let row = 0; row < style.rows; row++) {

      const row: GridLayoutCell[] = [];
      let x = left;
      for (let col = 0; col < style.columns; col++) {

        row.push({
          layoutArea: null,
          left: x,
          top: y,
          right: x + cellWidth - 1,
          bottom: y + cellHeight - 1
        });

        x += style.columnGap + cellWidth;
      }

      cells.push(row);

      y += style.rowGap + cellHeight;
    }

    let childIndex = 0;
    for (let rowIndex = 0; rowIndex < style.rows; rowIndex++) {

      if (childIndex >= layoutArea.children.length) {
        break;
      }

      for (let columnIndex = 0; columnIndex < style.columns; columnIndex++) {

        if (childIndex >= layoutArea.children.length) {
          break;
        }

        const cell = cells[rowIndex][columnIndex];

        const child = layoutArea.children[childIndex];

        if (cell.layoutArea == null) {

          child.left = cell.left;
          child.top = cell.top;

          for (let row = 0; row < child.rowSpan; row++) {

            for (let col = 0; col < child.colSpan; col++) {

              const span_cell = cells[rowIndex + row][columnIndex + col];

              child.right = span_cell.right;
              child.bottom = span_cell.bottom;

              span_cell.layoutArea = child;
            }
          }

          child.width = child.getWidth();
          child.height = child.getHeight();

          childIndex++;
        }
      }
    }
  }

  static hitTestLayout(areas: List<RectangleLayoutArea> | RectangleLayoutArea, x: float, y: float): RectangleLayoutArea {

    if (areas instanceof Array) {

      for (let area of areas) {

        if (this.hitTestLayoutRectangle(area, x, y)) {

          return area;
        }
      }
    }
    else if (areas instanceof RectangleLayoutArea){

      if (this.hitTestLayoutRectangle(areas, x, y)) {

        return areas;
      }
    }

    return null;
  }

  static hitTestLayoutRectangle(area: RectangleLayoutArea, x: float, y: float): boolean {

    if (x >= area.left
      && x <= area.right
      && y >= area.top
      && y <= area.bottom) {

      return true;
    }
    else {

      return false;
    }
  }

  static isChanged(area: RectangleLayoutArea) {

    return (area != null && area.isChanged());
  }
}
