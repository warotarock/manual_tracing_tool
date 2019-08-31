
namespace ManualTracingTool {

    export class CanvasWindow {

        canvas: HTMLCanvasElement = null;
        context: CanvasRenderingContext2D = null;

        width: float = 0.0;
        height: float = 0.0;

        viewLocation = vec3.fromValues(0.0, 0.0, 0.0);
        centerLocationRate = vec3.fromValues(0.0, 0.0, 0.0);
        viewScale = 1.0;
        viewRotation = 0.0;

        mirrorX = false;
        mirrorY = false;

        maxViewScale = 30.0;
        minViewScale = 0.1;

        transformMatrix = mat4.create();

        private tempVec3 = vec3.create();

        copyTransformTo(targetWindow: CanvasWindow) {

            vec3.copy(targetWindow.viewLocation, this.viewLocation);
            vec3.copy(targetWindow.centerLocationRate, this.centerLocationRate);
            targetWindow.viewScale = this.viewScale;
            targetWindow.viewRotation = this.viewRotation;
            targetWindow.mirrorX = this.mirrorX;
            targetWindow.mirrorY = this.mirrorY;
            mat4.copy(targetWindow.transformMatrix, this.transformMatrix);
        }

        addViewScale(addScale: float) {

            this.viewScale *= addScale;

            if (this.viewScale >= this.maxViewScale) {

                this.viewScale = this.maxViewScale;
            }

            if (this.viewScale <= this.minViewScale) {

                this.viewScale = this.minViewScale;
            }
        }

        updateViewMatrix() {

            this.caluclateViewMatrix(this.transformMatrix);
        }

        caluclateViewMatrix(result: Mat4) {

            mat4.identity(result);

            mat4.translate(result, result, vec3.set(this.tempVec3, this.width * this.centerLocationRate[0], this.height * this.centerLocationRate[0], 1.0));
            mat4.scale(result, result, vec3.set(this.tempVec3, this.viewScale, this.viewScale, 1.0));
            if (this.mirrorX) {
                mat4.scale(result, result, vec3.set(this.tempVec3, -1.0, 1.0, 1.0));
            }
            if (this.mirrorY) {
                mat4.scale(result, result, vec3.set(this.tempVec3, 1.0, -1.0, 1.0));
            }
            mat4.rotateZ(result, result, this.viewRotation * Math.PI / 180.0);
            //mat4.translate(mat, mat, vec3.set(this.tempVec3, -this.width / 2, -this.height / 2, 0.0));

            mat4.translate(result, result, vec3.set(this.tempVec3, -this.viewLocation[0], -this.viewLocation[1], 0.0));
        }

        calculateViewUnitMatrix(result: Mat4) {

            mat4.identity(result);
            mat4.scale(result, result, vec3.set(this.tempVec3, this.viewScale, this.viewScale, 1.0));
            mat4.rotateZ(result, result, this.viewRotation * Math.PI / 180.0);
        }
    }

    export enum CanvasRenderBlendMode {

        default, alphaOver, add, color, luminosity
    }

    export enum CanvasRenderLineCap {

        butt, round, square
    }

    export class CanvasRender {

        private context: CanvasRenderingContext2D = null;
        private currentTransform = mat4.create();
        private tempVec3 = vec3.create();
        private tempMat = mat4.create();
        private viewWidth = 1.0;
        private viewHeight = 1.0;
        private viewScale = 1.0;

        private viewCenterX = 0.0;
        private viewCenterY = 0.0;
        private viewRange = 1.0;

        setContext(canvasWindow: CanvasWindow) {

            this.context = canvasWindow.context;
            this.viewWidth = canvasWindow.width;
            this.viewHeight = canvasWindow.height;
            this.viewScale = canvasWindow.viewScale;

            this.viewCenterX = canvasWindow.viewLocation[0];
            this.viewCenterY = canvasWindow.viewLocation[1];
            this.viewRange = Math.sqrt(Math.pow(this.viewWidth * 0.5, 2) + Math.pow(this.viewHeight * 0.5, 2)) / this.viewScale;

            canvasWindow.updateViewMatrix();

            this.setContextTransformByWindow(canvasWindow);
        }

        getViewScale(): float {

            return this.viewScale;
        }

        resetTransform() {

            mat4.identity(this.tempMat);

            this.setContextTransform(this.tempMat);
        }

        setTransform(canvasWindow: CanvasWindow) {

            canvasWindow.updateViewMatrix();

            this.setContextTransformByWindow(canvasWindow);
        }

        setLocalTransForm(matrix: Mat4) {

            mat4.multiply(this.tempMat, this.currentTransform, matrix);

            this.setContextTransform(this.tempMat);
        }

        cancelLocalTransForm() {

            this.setContextTransform(this.currentTransform);
        }

        private setContextTransformByWindow(canvasWindow: CanvasWindow) {

            mat4.copy(this.currentTransform, canvasWindow.transformMatrix);

            this.setContextTransform(canvasWindow.transformMatrix);
        }

        private setContextTransform(matrix: Mat4) {

            this.context.setTransform(
                matrix[0], matrix[1],
                matrix[4], matrix[5],
                matrix[12], matrix[13]);
        }

        isInViewRectangle(left: float, top: float, right: float, bottom: float, range: float) {

            let centerX = (right + left) * 0.5;
            let centerY = (bottom + top) * 0.5;

            let distance = Math.sqrt(Math.pow(centerX - this.viewCenterX, 2) + Math.pow(centerY - this.viewCenterY, 2));

            return ((distance - range) < this.viewRange);
        }

        clearRect(left: int, top: int, width: int, height: int) {

            this.context.setTransform(1.0, 0.0, 0.0, 1.0, 0.0, 0.0);

            this.context.clearRect(left, top, width, height);
        }

        private getColorStyleText(r: float, g: float, b: float, a: float) {

            return 'rgba(' + (r * 255).toFixed(0) + ',' + (g * 255).toFixed(0) + ',' + (b * 255).toFixed(0) + ',' + (a).toFixed(2) + ')';
        }

        private getColorStyleTextV(color: Vec4) {

            return this.getColorStyleText(color[0], color[1], color[2], color[3]);
        }

        setFillColor(r: float, g: float, b: float, a: float) {

            this.context.fillStyle = this.getColorStyleText(r, g, b, a);
        }

        setFillColorV(color: Vec4) {

            this.setFillColor(color[0], color[1], color[2], color[3]);
        }

        setFillLinearGradient(x0: float, y0: float, x1: float, y1: float, color1: Vec4, color2: Vec4) {

            var grad = this.context.createLinearGradient(x0, y0, x1, y1);
            grad.addColorStop(0.0, this.getColorStyleTextV(color1));
            grad.addColorStop(1.0, this.getColorStyleTextV(color2));
            this.context.fillStyle = grad;
        }

        setFillRadialGradient(x: float, y: float, r1: float, r2: float, color1: Vec4, color2: Vec4) {

            var grad = this.context.createRadialGradient(x, y, r1, x, y, r2);
            grad.addColorStop(0.0, this.getColorStyleTextV(color1));
            grad.addColorStop(1.0, this.getColorStyleTextV(color2));
            this.context.fillStyle = grad;
        }

        fillRect(left: int, top: int, width: int, height: int) {

            this.context.fillRect(left, top, width, height);
        }

        setStrokeWidth(width: float) {

            this.context.lineWidth = width;
        }

        setStrokeColor(r: float, g: float, b: float, a: float) {

            this.context.strokeStyle = this.getColorStyleText(r, g, b, a);
        }

        setStrokeColorV(color: Vec4) {

            this.setStrokeColor(color[0], color[1], color[2], color[3]);
        }

        setLineDash(segments: List<float>) {

            this.context.setLineDash(segments);
        }

        setGlobalAlpha(a: float) {

            this.context.globalAlpha = a;
        }

        setBlendMode(blendMode: CanvasRenderBlendMode) {

            if (blendMode == CanvasRenderBlendMode.default || blendMode == CanvasRenderBlendMode.alphaOver) {

                this.context.globalCompositeOperation = 'source-over';
            }
            else if (blendMode == CanvasRenderBlendMode.add) {

                this.context.globalCompositeOperation = 'lighter';
            }
            else if (blendMode == CanvasRenderBlendMode.luminosity) {

                this.context.globalCompositeOperation = 'luminosity';
            }
            else if (blendMode == CanvasRenderBlendMode.color) {

                this.context.globalCompositeOperation = 'color';
            }
        }

        setLineCap(lineCap: CanvasRenderLineCap) {

            this.context.lineCap = <CanvasLineCap>(CanvasRenderLineCap[lineCap]);
        }

        beginPath() {

            this.context.beginPath();
        }

        stroke() {

            this.context.stroke();
        }

        fill() {

            this.context.fill();
        }

        moveTo(x: float, y: float) {

            this.context.moveTo(x, y);
        }

        lineTo(x: float, y: float) {

            this.context.lineTo(x, y);
        }

        circle(x: float, y: float, radius: float) {

            this.context.arc(x, y, radius, 0.0, Math.PI * 2.0);
        }

        setFontSize(height: float) {

            this.context.font = height.toFixed(0) + "px 'ＭＳ Ｐゴシック'";
        }

        fillText(text: string, x: float, y: float) {

            this.context.fillText(text, x, y);
        }

        drawLine(x1: float, y1: float, x2: float, y2: float) {

            this.context.beginPath();
            this.context.moveTo(x1, y1);
            this.context.lineTo(x2, y2);
            this.context.stroke();
        }

        drawRectangle(x: float, y: float, width: float, height: float) {

            this.context.beginPath();
            this.context.strokeRect(x, y, width, height);
            this.context.stroke();
        }

        drawImage(image: any, srcX: float, srcY: float, srcW: float, srcH: float, dstX: float, detY: float, dstW: float, dstH: float) {

            this.context.drawImage(image, srcX, srcY, srcW, srcH, dstX, detY, dstW, dstH);
        }

        pickColor(outColor: Vec4, canvasWindow: CanvasWindow, x: float, y: float) {

            let imageData = canvasWindow.context.getImageData(Math.floor(x), Math.floor(y), 1, 1);

            vec4.set(outColor,
                imageData.data[0] / 255.0,
                imageData.data[1] / 255.0,
                imageData.data[2] / 255.0,
                imageData.data[3] / 255.0
            );
        }
    }
}
