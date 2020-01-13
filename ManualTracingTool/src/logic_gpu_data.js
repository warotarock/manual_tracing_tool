var ManualTracingTool;
(function (ManualTracingTool) {
    class GPULinePoint {
        constructor() {
            this.location = vec3.fromValues(0.0, 0.0, 0.0);
            this.width = 1.0;
            this.alpha = 1.0;
            this.isEndPoint = false;
            this.direction = vec3.fromValues(0.0, 0.0, 0.0);
            this.controlPointCF = vec3.fromValues(0.0, 0.0, 0.0); // 正方向への制御点の位置
            this.controlPointCB = vec3.fromValues(0.0, 0.0, 0.0); // 逆方向への制御点の位置
            this.edgePointL = vec3.fromValues(0.0, 0.0, 0.0); // 点の左側の頂点の位置
            this.controlPointLF = vec3.fromValues(0.0, 0.0, 0.0); // 左側の頂点から正方向への制御点の位置
            this.controlPointLB = vec3.fromValues(0.0, 0.0, 0.0); // 左側の頂点から負方向への制御点の位置
            this.edgePointR = vec3.fromValues(0.0, 0.0, 0.0); // 点の右側の頂点の位置
            this.controlPointRF = vec3.fromValues(0.0, 0.0, 0.0); // 右側の頂点から正方向への制御点の位置
            this.controlPointRB = vec3.fromValues(0.0, 0.0, 0.0); // 右側の頂点から負方向への制御点の位置
            this.controlPointVertexLF = vec3.fromValues(0.0, 0.0, 0.0); // 曲線を囲むように配置したポリゴンの頂点座標
            this.controlPointVertexLB = vec3.fromValues(0.0, 0.0, 0.0);
            this.controlPointVertexRF = vec3.fromValues(0.0, 0.0, 0.0);
            this.controlPointVertexRB = vec3.fromValues(0.0, 0.0, 0.0);
            this.pointMat = mat4.create();
            this.invMat = mat4.create();
        }
        copyFrom(linePoint, lineWidthBiasRate, useAdjustingLocation) {
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
    ManualTracingTool.GPULinePoint = GPULinePoint;
    class GPULine {
        constructor() {
            this.points = new List();
        }
    }
    ManualTracingTool.GPULine = GPULine;
    class GPUVertexBuffer {
        constructor() {
            this.pointCount = 0;
            this.recyclePoints = new List();
            this.lines = new List();
            this.dataArray = null;
            this.usedDataArraySize = 0;
            this.bufferSize = 0;
            this.buffer = null;
            this.isStored = false;
        }
    }
    ManualTracingTool.GPUVertexBuffer = GPUVertexBuffer;
})(ManualTracingTool || (ManualTracingTool = {}));
