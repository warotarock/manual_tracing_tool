class RenderModel {
    constructor() {
        this.vertexBuffer = null;
        this.indexBuffer = null;
        this.vertexData = null;
        this.indexData = null;
        this.indexCount = 0;
        this.vertexDataStride = 0;
    }
}
class RenderImage {
    constructor() {
        this.width = 0;
        this.height = 0;
        this.texture = null;
        this.imageData = null;
    }
}
class RenderShader {
    constructor() {
        this.floatPrecisionDefinitionCode = '';
        this.vertexShaderSourceCode = '';
        this.fragmentShaderSourceCode = '';
        this.vertexShader = null;
        this.fragmentShader = null;
        this.program = null;
        this.attribLocationList = new List();
        this.vertexAttribPointerOffset = 0;
        this.uPMatrix = null;
        this.uMVMatrix = null;
    }
    initializeSourceCode(precisionText) {
        this.floatPrecisionDefinitionCode = '#ifdef GL_ES\n precision ' + precisionText + ' float;\n #endif\n';
        this.initializeVertexSourceCode();
        this.initializeFragmentSourceCode();
    }
    initializeVertexSourceCode() {
        // Override method
    }
    initializeFragmentSourceCode() {
        // Override method
    }
    initializeAttributes() {
        this.initializeAttributes_RenderShader();
    }
    initializeAttributes_RenderShader() {
        this.uPMatrix = this.getUniformLocation('uPMatrix');
        this.uMVMatrix = this.getUniformLocation('uMVMatrix');
    }
    getAttribLocation(name) {
        let attribLocation = this.gl.getAttribLocation(this.program, name);
        this.attribLocationList.push(attribLocation);
        return attribLocation;
    }
    getUniformLocation(name) {
        return this.gl.getUniformLocation(this.program, name);
    }
    setBuffers(model, images) {
        // Override method
    }
    enableVertexAttributes() {
        for (let attribLocation of this.attribLocationList) {
            this.gl.enableVertexAttribArray(attribLocation);
        }
    }
    disableVertexAttributes() {
        for (let attribLocation of this.attribLocationList) {
            this.gl.disableVertexAttribArray(attribLocation);
        }
    }
    resetVertexAttribPointerOffset() {
        this.vertexAttribPointerOffset = 0;
    }
    vertexAttribPointer(indx, size, type, stride) {
        let gl = this.gl;
        if (type == gl.FLOAT || type == gl.INT) {
            gl.vertexAttribPointer(indx, size, type, false, stride, this.vertexAttribPointerOffset);
            this.vertexAttribPointerOffset += 4 * size;
        }
    }
    skipVertexAttribPointer(type, size) {
        let gl = this.gl;
        if (type == gl.FLOAT || type == gl.INT) {
            this.vertexAttribPointerOffset += 4 * size;
        }
    }
    setProjectionMatrix(matrix) {
        this.gl.uniformMatrix4fv(this.uPMatrix, false, matrix);
    }
    setModelViewMatrix(matrix) {
        this.gl.uniformMatrix4fv(this.uMVMatrix, false, matrix);
    }
}
var WebGLRenderBlendType;
(function (WebGLRenderBlendType) {
    WebGLRenderBlendType[WebGLRenderBlendType["blend"] = 1] = "blend";
    WebGLRenderBlendType[WebGLRenderBlendType["add"] = 2] = "add";
    WebGLRenderBlendType[WebGLRenderBlendType["src"] = 3] = "src";
})(WebGLRenderBlendType || (WebGLRenderBlendType = {}));
class WebGLRender {
    constructor() {
        this.gl = null;
        this.floatPrecisionText = '';
        this.currentShader = null;
    }
    initializeWebGL(canvas) {
        try {
            let option = { preserveDrawingBuffer: true, antialias: true };
            let gl = (canvas.getContext('webgl', option)
                || canvas.getContext('experimental-webgl', option));
            if (gl != null) {
                this.attach(gl);
            }
            else {
                throw ('Faild to initialize WebGL.');
            }
        }
        catch (e) {
            return true;
        }
        return false;
    }
    attach(gl) {
        this.gl = gl;
        let format = this.gl.getShaderPrecisionFormat(this.gl.FRAGMENT_SHADER, this.gl.HIGH_FLOAT);
        this.floatPrecisionText = format.precision != 0 ? 'highp' : 'mediump';
        this.resetBasicParameters();
    }
    initializeModelBuffer(model, vertexData, indexData, vertexDataStride) {
        model.vertexBuffer = this.createVertexBuffer(vertexData, this.gl);
        model.indexBuffer = this.createIndexBuffer(indexData, this.gl);
        model.vertexData = vertexData;
        model.indexData = indexData;
        model.indexCount = indexData.length;
        model.vertexDataStride = vertexDataStride;
    }
    createVertexBuffer(data, gl) {
        let glBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, glBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        return glBuffer;
    }
    createIndexBuffer(data, gl) {
        let glBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, glBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(data), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        return glBuffer;
    }
    releaseModelBuffer(model) {
        let gl = this.gl;
        if (model.vertexBuffer != null) {
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            gl.deleteBuffer(model.vertexBuffer);
            model.vertexBuffer = null;
        }
        if (model.indexBuffer != null) {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
            gl.deleteBuffer(model.indexBuffer);
            model.indexBuffer = null;
        }
    }
    initializeImageTexture(image) {
        let gl = this.gl;
        let glTexture = gl.createTexture();
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
        gl.bindTexture(gl.TEXTURE_2D, glTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image.imageData);
        //gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.bindTexture(gl.TEXTURE_2D, null);
        image.texture = glTexture;
        image.width = image.imageData.width;
        image.height = image.imageData.height;
    }
    releaseImageTexture(image) {
        let gl = this.gl;
        if (image.texture != null) {
            gl.bindTexture(gl.TEXTURE_2D, null);
            gl.deleteTexture(image.texture);
            image.texture = null;
        }
    }
    setTextureImageFromCanvas(image, canvas) {
        let gl = this.gl;
        gl.bindTexture(gl.TEXTURE_2D, image.texture);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }
    initializeShader(shader) {
        let gl = this.gl;
        shader.gl = gl;
        shader.initializeSourceCode(this.floatPrecisionText);
        let program = gl.createProgram();
        let vertexShader = this.createShader(String(shader.vertexShaderSourceCode), true, gl);
        let fragmentShader = this.createShader(shader.fragmentShaderSourceCode, false, gl);
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
            shader.program = program;
            shader.vertexShader = vertexShader;
            shader.fragmentShader = fragmentShader;
            shader.initializeAttributes();
        }
        else {
            throw (gl.getProgramInfoLog(program));
        }
    }
    createShader(glslSourceCode, isVertexShader, gl) {
        let shader;
        if (isVertexShader) {
            shader = gl.createShader(gl.VERTEX_SHADER);
        }
        else {
            shader = gl.createShader(gl.FRAGMENT_SHADER);
        }
        gl.shaderSource(shader, glslSourceCode);
        gl.compileShader(shader);
        if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            return shader;
        }
        else {
            alert(gl.getShaderInfoLog(shader));
        }
    }
    releaseShader(shader) {
        let gl = this.gl;
        if (shader.program != null) {
            gl.useProgram(null);
            gl.detachShader(shader.program, shader.vertexShader);
            gl.deleteShader(shader.vertexShader);
            shader.vertexShader = null;
            gl.detachShader(shader.program, shader.fragmentShader);
            gl.deleteShader(shader.fragmentShader);
            shader.fragmentShader = null;
            gl.deleteShader(shader.program);
            shader.program = null;
        }
    }
    setShader(shader) {
        let lastShader = this.currentShader;
        this.gl.useProgram(shader.program);
        this.currentShader = shader;
        if (lastShader != null
            && lastShader.attribLocationList.length != this.currentShader.attribLocationList.length) {
            lastShader.disableVertexAttributes();
        }
    }
    setBuffers(model, images) {
        this.currentShader.setBuffers(model, images);
    }
    clearColorBufferDepthBuffer(r, g, b, a) {
        this.gl.clearColor(r, g, b, a);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }
    clearDepthBuffer() {
        this.gl.clear(this.gl.DEPTH_BUFFER_BIT);
    }
    setTextureFilterNearest() {
        let gl = this.gl;
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    }
    setTextureFilterLinear() {
        let gl = this.gl;
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    }
    resetBasicParameters() {
        this.setDepthTest(true);
        this.setDepthMask(true);
        this.setCulling(true);
        this.setBlendType(WebGLRenderBlendType.blend);
    }
    setViewport(x, y, width, height) {
        this.gl.viewport(x, y, width, height);
    }
    setDepthTest(enable) {
        let gl = this.gl;
        if (enable) {
            gl.enable(gl.DEPTH_TEST);
        }
        else {
            gl.disable(gl.DEPTH_TEST);
        }
        return this;
    }
    setDepthMask(enable) {
        this.gl.depthMask(enable);
        return this;
    }
    setCulling(enable) {
        let gl = this.gl;
        if (enable) {
            gl.enable(gl.CULL_FACE);
        }
        else {
            gl.disable(gl.CULL_FACE);
        }
        return this;
    }
    setCullingBackFace(cullBackFace) {
        let gl = this.gl;
        if (cullBackFace) {
            gl.cullFace(gl.BACK);
        }
        else {
            gl.cullFace(gl.FRONT);
        }
        return this;
    }
    setBlendType(blendType) {
        let gl = this.gl;
        gl.enable(gl.BLEND);
        if (blendType == WebGLRenderBlendType.add) {
            gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE, gl.ONE, gl.ONE);
            gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);
        }
        else if (blendType == WebGLRenderBlendType.src) {
            gl.blendFuncSeparate(gl.ONE, gl.ZERO, gl.ONE, gl.ZERO);
            gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);
        }
        else {
            gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE);
            gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);
        }
        return this;
    }
    drawElements(model) {
        this.gl.drawElements(this.gl.TRIANGLES, model.indexCount, this.gl.UNSIGNED_SHORT, 0);
    }
    drawArrayTryangles(tryangleCount) {
        this.gl.drawArrays(this.gl.TRIANGLES, 0, tryangleCount);
    }
}
