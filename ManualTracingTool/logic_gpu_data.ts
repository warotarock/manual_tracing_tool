
namespace ManualTracingTool {

    export class GPULinePoint {

        location: Vec3 = vec3.fromValues(0.0, 0.0, 0.0);
        width = 1.0;
        alpha = 1.0;
        isEndPoint = false;

        direction = vec3.fromValues(0.0, 0.0, 0.0);
        controlPointCF = vec3.fromValues(0.0, 0.0, 0.0); // 正方向への制御点の位置
        controlPointCB = vec3.fromValues(0.0, 0.0, 0.0); // 逆方向への制御点の位置

        edgePointL = vec3.fromValues(0.0, 0.0, 0.0);     // 点の左側の頂点の位置
        controlPointLF = vec3.fromValues(0.0, 0.0, 0.0); // 左側の頂点から正方向への制御点の位置
        controlPointLB = vec3.fromValues(0.0, 0.0, 0.0); // 左側の頂点から逆方向への制御点の位置

        edgePointR = vec3.fromValues(0.0, 0.0, 0.0);     // 点の右側の頂点の位置
        controlPointRF = vec3.fromValues(0.0, 0.0, 0.0); // 右側の頂点から正方向への制御点の位置
        controlPointRB = vec3.fromValues(0.0, 0.0, 0.0); // 右側の頂点から逆方向への制御点の位置

        controlPointVertexLF = vec3.fromValues(0.0, 0.0, 0.0); // 曲線を囲むように配置したポリゴンの頂点座標
        controlPointVertexLB = vec3.fromValues(0.0, 0.0, 0.0);
        controlPointVertexRF = vec3.fromValues(0.0, 0.0, 0.0);
        controlPointVertexRB = vec3.fromValues(0.0, 0.0, 0.0);

        pointMat = mat4.create();
        invMat = mat4.create();

        copyFrom(linePoint: LinePoint, lineWidthBiasRate: float, useAdjustingLocation: boolean) {

            if (useAdjustingLocation) {

                this.location[0] = linePoint.adjustingLocation[0];
                this.location[1] = linePoint.adjustingLocation[1];
                this.width = linePoint.adjustingLineWidth * lineWidthBiasRate;
                this.alpha = 1.0;
            }
            else {

                this.location[0] = linePoint.location[0];
                this.location[1] = linePoint.location[1];
                this.width = linePoint.lineWidth * lineWidthBiasRate;
                this.alpha = 1.0;
            }

            this.isEndPoint = false;
        }
    }

    export class GPULine {

        points = new List<GPULinePoint>();
    }

    export class GPUVertexBuffer {

        pointCount = 0;
        recyclePoints = new List<GPULinePoint>();

        lines = new List<GPULine>();

        dataArray: Float32Array = null;
        usedDataArraySize = 0;

        bufferSize = 0;
        buffer: WebGLBuffer = null;
        isStored = false;
    }
}
