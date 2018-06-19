
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

        maxViewScale = 30.0;
        minViewScale = 0.1;

        transformMatrix = mat4.create();

        private tempVec3 = vec3.create();

        copyTransformTo(targetWindow: CanvasWindow) {

            vec3.copy(targetWindow.viewLocation, this.viewLocation);
            vec3.copy(targetWindow.centerLocationRate, this.centerLocationRate);
            targetWindow.viewScale = this.viewScale;
            targetWindow.viewRotation = this.viewRotation;
            mat4.copy(targetWindow.transformMatrix, this.transformMatrix);
        }

        addViewScale(addScale: float) {

            this.viewScale += addScale;

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

        caluclateViewMatrix(mat: Mat4) {

            mat4.identity(mat);

            mat4.translate(mat, mat, vec3.set(this.tempVec3, this.width * this.centerLocationRate[0], this.height * this.centerLocationRate[0], 1.0));
            mat4.scale(mat, mat, vec3.set(this.tempVec3, this.viewScale, this.viewScale, 1.0));
            mat4.rotateZ(mat, mat, this.viewRotation * Math.PI / 180.0);
            //mat4.translate(mat, mat, vec3.set(this.tempVec3, -this.width / 2, -this.height / 2, 0.0));

            mat4.translate(mat, mat, vec3.set(this.tempVec3, -this.viewLocation[0], -this.viewLocation[1], 0.0));
        }

        calculateViewUnitMatrix(out: Mat4) {

            mat4.identity(out);
            mat4.scale(out, out, vec3.set(this.tempVec3, this.viewScale, this.viewScale, 1.0));
            mat4.rotateZ(out, out, this.viewRotation * Math.PI / 180.0);
        }
    }

    export class CanvasRender {

        private context: CanvasRenderingContext2D = null;
        private tempVec3 = vec3.create();
        private viewScale = 1.0;

        setContext(canvasWindow: CanvasWindow) {

            this.context = canvasWindow.context;
            this.viewScale = canvasWindow.viewScale;

            canvasWindow.updateViewMatrix();

            this.updateContextTransform(canvasWindow);
        }

        setTransform(canvasWindow: CanvasWindow) {

            canvasWindow.updateViewMatrix();

            this.updateContextTransform(canvasWindow);
        }

        getViewScale(): float {

            return this.viewScale;
        }

        clearRect(left: int, top: int, width: int, height: int) {

            this.context.setTransform(1.0, 0.0, 0.0, 1.0, 0.0, 0.0);

            this.context.clearRect(left, top, width, height);
        }

        private updateContextTransform(canvasWindow: CanvasWindow) {

            let mat = canvasWindow.transformMatrix;

            this.context.setTransform(
                mat[0], mat[1],
                mat[4], mat[5],
                mat[12], mat[13]);
        }

        setFillColor(r: float, g: float, b: float, a: float) {

            this.context.fillStyle = 'rgb(' + (r * 255).toFixed(0) + ',' + (g * 255).toFixed(0) + ',' + (b * 255).toFixed(0) + ')';
        }

        setFillColorV(color: Vec4) {

            this.setFillColor(color[0], color[1], color[2], color[3]);
        }

        fillRect(left: int, top: int, width: int, height: int) {

            this.context.fillRect(left, top, width, height);
        }

        setStrokeWidth(width: float) {

            this.context.lineWidth = width;
        }

        setStrokeColor(r: float, g: float, b: float, a: float) {

            this.context.strokeStyle = 'rgba(' + (r * 255).toFixed(0) + ',' + (g * 255).toFixed(0) + ',' + (b * 255).toFixed(0) + ',' + (a).toFixed(2) + ')';
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

        drawImage(image: any, srcX: float, srcY: float, srcW: float, srcH: float, dstX: float, detY: float, dstW: float, dstH: float) {

            this.context.drawImage(image, srcX, srcY, srcW, srcH, dstX, detY, dstW, dstH);
        }
    }
}
