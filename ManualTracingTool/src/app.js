var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var ManualTracingTool;
(function (ManualTracingTool) {
    // 今やること (current tasks)
    // ・線スクラッチの線修正ツールを実用的な使いやすさにする
    // 　・スクラッチツールで途中の点が一部だけギリギリ遠いために編集の対象にならないときがあるが、それをどうにかしたい
    // ・線の太さを変えられるツールを追加
    // 　・基本の線の太さ、筆圧での最小最大幅（割合）を設定できるようにする。設定ダイアログに追加。
    // 　・線を何度もなぞって太くするツール追加→編集線の方向に太さを足すという考え方→編集線への距離が近いほど、その距離に等しい分の太さを足す。足した太さ分だけ点の位置を編集線の方向に移動する。
    // 　・線を何度もなぞって細くするツール追加→編集線で削るという考え方をする→逆のようで微妙に違うかも
    // ・筆圧を線の太さに影響できるようにするとどうなるか試す
    // ・ドローツールで線の最後の点が重複している（リサンプリングで最後と同じ位置に点が追加されている？）
    // どこかでやる必要があること (nearest future tasks)
    // ・アクティブ線、レイヤによる絞り込み処理と可視化
    // ・ファイル保存、読み込み
    // ・PNG出力、jpeg出力
    // ・現在のレイヤーが変わったときにメインツールを自動で変更する。ベクターレイヤーならスクラッチツールとドローツールのどちらかを記憶、ポージングレイヤーならポーズにする
    // 既知のバグ (remaining bugs)
    // ・現在のレイヤーが移動したときにカーソルが変な位置に出る
    // ・点の移動ツールなどで右クリックでキャンセルしたときに点の位置がモーダル中の位置で表示されつづけていた
    // ・ポージングツール以外のツールでパンしたとき３Ⅾが更新されない
    // いつかやる (anytime tasks)
    // ・ラティス変形ツール
    // ・レイヤーカラーをどこかに表示する
    // ・レイヤーカラーとレイヤーの透明度の関係を考え直す
    // ・レイヤー削除時に削除前に次に表示されていたレイヤーを選択する
    // ・塗りつぶし
    // ・複数のポージングレイヤーの描画
    // ・ポージングレイヤーの表示/非表示、透明度
    // ・ポージングで入力後にキャラの拡大縮小を可能にする
    // ・ポージングで頭の角度の入力で画面の回転に対応する
    // ・Logic_VectorLayerをどこかよいファイルに移動する
    // ・線の複製
    // ・グループの複製
    // ・レイヤーの複製
    // ・モディファイアスタック
    // ・線スクラッチの点削減ツールの実現
    // 　直線上の点は削減する
    // 　曲線が曲がった量が一定を超えたところでそこまでの部分曲線の真ん中に点を配置するという方法、部分曲線に点が一つしかない場合どうするか？
    // ・レイヤーを選択変更したときレイヤーに応じたコンテキストの状態になるようにする
    // 終わったもの (done)
    // ・頂点ごとの全選択、全選択解除
    // ・変形ツール
    //   平行移動、回転、拡大縮小
    //     モーダルツールの仕組みを作る→currentToolを一時的に変える→現在のツールを一時対比する変数→モーダル用のツールイベントを用意
    // ・スクラッチツールで選択中の点のみ対象にできるよう修正
    // ・編集単位ロジック
    //   ・共通のアクティブ線
    // ・線が１本もないときにエラーが出るためなんとかしる！→線の削除処理でグループの線のリストがnullになる場合があったため。直した。
    // ・編集単位選択UIの作成
    // ・編集単位ロジック
    //   ・点、線、変、レイヤーそれぞれの選択ツールクラスの作成
    //   ・編集単位選択UIの状態で選択ツールを切り替える
    // ・レイヤーカラーの設定（カラーピッカー）→レイヤーの設定ウィンドウを出して設定するようにしてみた→モーダルウィンドウの中身を実装する→絵を見ながら設定できるように
    // ・レイヤーの表示/非表示の切り替え（レイヤー名の左に目のマークを表示）
    // ・メインツールを変更したときレイヤーに応じたコンテキストの状態になるようにする
    // ・アフィン変換ツール
    // ・点の移動ツール
    // ・線スクラッチの線修正ツールの編集線のサンプリングにビューのスケールを反映
    // ・線の延長にビューのスケールが反映されていないらしい？
    // ・現在のツールに応じた全選択、全選択解除処理
    // ・移動ツールなどで操作をするたびに縦方向に小さくなっていくバグを直す
    // 　・線の延長を別ツールにする
    // ・線スクラッチの線修正ツールを実用的な使いやすさにする
    // 　・編集線上に近接位置がない点への影響度のフォールオフを無くしたり、大きくしたりしてみる
    // 　・線の延長の最初の点の扱いを調整する
    var MainProcessStateID;
    (function (MainProcessStateID) {
        MainProcessStateID[MainProcessStateID["none"] = 0] = "none";
        MainProcessStateID[MainProcessStateID["SystemResourceLoading"] = 1] = "SystemResourceLoading";
        MainProcessStateID[MainProcessStateID["InitialDocumentJSONLoading"] = 2] = "InitialDocumentJSONLoading";
        MainProcessStateID[MainProcessStateID["InitialDocumentResourceLoading"] = 3] = "InitialDocumentResourceLoading";
        MainProcessStateID[MainProcessStateID["Running"] = 4] = "Running";
        MainProcessStateID[MainProcessStateID["DocumentResourceLoading"] = 5] = "DocumentResourceLoading";
        MainProcessStateID[MainProcessStateID["DocumentJSONLoading"] = 6] = "DocumentJSONLoading";
    })(MainProcessStateID || (MainProcessStateID = {}));
    var Main = /** @class */ (function () {
        function Main() {
            this.mainProcessState = MainProcessStateID.none;
            // UI elements
            this.mainWindow = new ManualTracingTool.CanvasWindow();
            this.editorWindow = new ManualTracingTool.CanvasWindow();
            this.layerWindow = new LayerWindow();
            this.webglWindow = new ManualTracingTool.CanvasWindow();
            this.pickingWindow = new ManualTracingTool.PickingWindow();
            this.canvasRender = new ManualTracingTool.CanvasRender();
            this.webGLRender = new WebGLRender();
            this.ID = new HTMLElementID();
            // Resources
            this.systemImage = null;
            this.subToolImages = new List();
            this.layerButtonImage = null;
            // Integrated tool system
            this.toolContext = null;
            this.toolEnv = null;
            this.toolDrawEnv = null;
            this.toolMouseEvent = new ManualTracingTool.ToolMouseEvent();
            this.mainTools = new List();
            this.currentTool = null;
            this.currentSelectTool = null;
            //layerCommands = new List<Command_Layer_CommandBase>(LayerWindowButtonID.IDCount);
            // Modal tools
            this.currentModalTool = null;
            this.modalBeforeTool = null;
            this.vectorLayer_ModalTools = List(ModalToolID.countOfID);
            this.imageFileReferenceLayer_ModalTools = List(ModalToolID.countOfID);
            // Selection tools
            this.selectionTools = List(ManualTracingTool.OperationUnitID.countOfID);
            this.tool_LinePointBrushSelect = new ManualTracingTool.Tool_Select_BrushSelet_LinePoint();
            this.tool_LineSegmentBrushSelect = new ManualTracingTool.Tool_Select_BrushSelet_LineSegment();
            this.tool_LineBrushSelect = new ManualTracingTool.Tool_Select_BrushSelet_Line();
            this.tool_SelectAllPoints = new ManualTracingTool.Tool_Select_All_LinePoint();
            // File reference layer tools
            this.tool_EditImageFileReference = new ManualTracingTool.Tool_EditImageFileReference();
            this.tool_Transform_ReferenceImage_GrabMove = new ManualTracingTool.Tool_Transform_ReferenceImage_GrabMove();
            this.tool_Transform_ReferenceImage_Rotate = new ManualTracingTool.Tool_Transform_ReferenceImage_Rotate();
            this.tool_Transform_ReferenceImage_Scale = new ManualTracingTool.Tool_Transform_ReferenceImage_Scale();
            // Transform tools
            this.tool_Transform_Lattice_GrabMove = new ManualTracingTool.Tool_Transform_Lattice_GrabMove();
            this.tool_Transform_Lattice_Rotate = new ManualTracingTool.Tool_Transform_Lattice_Rotate();
            this.tool_Transform_Lattice_Scale = new ManualTracingTool.Tool_Transform_Lattice_Scale();
            // Drawing tools
            this.tool_DrawLine = new ManualTracingTool.Tool_DrawLine();
            this.tool_AddPoint = new ManualTracingTool.Tool_AddPoint();
            this.tool_ScratchLine = new ManualTracingTool.Tool_ScratchLine();
            this.tool_ExtrudeLine = new ManualTracingTool.Tool_ExtrudeLine();
            this.tool_ScratchLineWidth = new ManualTracingTool.Tool_ScratchLineWidth();
            this.tool_ResampleSegment = new ManualTracingTool.Tool_Resample_Segment();
            this.hittest_Line_IsCloseTo = new ManualTracingTool.HitTest_Line_IsCloseToMouse();
            // Posing tools
            this.posing3dView = new ManualTracingTool.Posing3DView();
            this.posing3DLogic = new ManualTracingTool.Posing3DLogic();
            this.tool_Posing3d_LocateHead = new ManualTracingTool.Tool_Posing3d_LocateHead();
            this.tool_Posing3d_RotateHead = new ManualTracingTool.Tool_Posing3d_RotateHead();
            this.tool_Posing3d_TwistHead = new ManualTracingTool.Tool_Posing3d_TwistHead();
            this.tool_Posing3d_LocateBody = new ManualTracingTool.Tool_Posing3d_LocateBody();
            this.tool_Posing3d_RatateBody = new ManualTracingTool.Tool_Posing3d_RatateBody();
            this.tool_Posing3d_LocateLeftArm1 = new ManualTracingTool.Tool_Posing3d_LocateLeftArm1();
            this.tool_Posing3d_LocateLeftArm2 = new ManualTracingTool.Tool_Posing3d_LocateLeftArm2();
            this.tool_Posing3d_LocateRightArm1 = new ManualTracingTool.Tool_Posing3d_LocateRightArm1();
            this.tool_Posing3d_LocateRightArm2 = new ManualTracingTool.Tool_Posing3d_LocateRightArm2();
            this.tool_Posing3d_LocateLeftLeg1 = new ManualTracingTool.Tool_Posing3d_LocateLeftLeg1();
            this.tool_Posing3d_LocateLeftLeg2 = new ManualTracingTool.Tool_Posing3d_LocateLeftLeg2();
            this.tool_Posing3d_LocateRightLeg1 = new ManualTracingTool.Tool_Posing3d_LocateRightLeg1();
            this.tool_Posing3d_LocateRightLeg2 = new ManualTracingTool.Tool_Posing3d_LocateRightLeg2();
            this.imageResurces = new List();
            this.modelFile = new ManualTracingTool.ModelFile();
            this.modelResources = new List();
            // Document data
            this.document = null;
            this.lastFileKey = 'Manual tracing tool last used file url';
            this.tempFileNameKey = 'Manual tracing tool save data';
            this.loadingDocumentImageResources = null;
            // Setting values
            this.drawStyle = new ManualTracingTool.ToolDrawingStyle();
            // Work variable
            this.view2DMatrix = mat4.create();
            this.invView2DMatrix = mat4.create();
            this.tempVec3 = vec3.create();
            this.tempMat4 = mat4.create();
            this.editOtherLayerLineColor = vec4.fromValues(1.0, 1.0, 1.0, 0.5);
            this.tempEditorLinePointColor1 = vec4.fromValues(0.0, 0.0, 0.0, 1.0);
            this.tempEditorLinePointColor2 = vec4.fromValues(0.0, 0.0, 0.0, 1.0);
            // Dialogs
            this.currentModalDialogID = null;
            this.currentModalDialogResult = null;
            this.layerPropertyWindow_EditLayer = null;
            this.layerPropertyWindow_LayerClolor = vec4.fromValues(0.0, 0.0, 0.0, 1.0);
            this.modalOverlayOption = {
                speedIn: 0,
                speedOut: 100,
                opacity: 0.0
            };
            this.modalLoaderOption = {
                active: false
            };
            // Main window drawing
            this.dragBeforeTransformMatrix = mat4.create();
            this.dragBeforeViewLocation = vec3.create();
            this.operatorCurosrLineDash = [2.0, 2.0];
            this.operatorCurosrLineDashScaled = [0.0, 0.0];
            this.operatorCurosrLineDashNone = [];
            // Layer window drawing
            this.layerWindowLayoutArea = new RectangleLayoutArea();
            this.layerWindowItems = null;
            this.layerWindowButtons = null;
            this.subToolViewItems = null;
            this.layerWindowBackgroundColor = vec4.fromValues(1.0, 1.0, 1.0, 1.0);
            this.layerWindowItemSelectedColor = vec4.fromValues(0.9, 0.9, 1.0, 1.0);
            this.subToolItemSelectedColor = vec4.fromValues(0.9, 0.9, 1.0, 1.0);
            this.subToolItemSeperatorLineColor = vec4.fromValues(0.0, 0.0, 0.0, 0.5);
            // Footer window drawing
            this.footerText = '';
            this.footerTextBefore = '';
            this.modelFile.file('models.json');
            this.imageResurces.push(new ManualTracingTool.ImageResource().file('texture01.png').tex(true));
            this.imageResurces.push(new ManualTracingTool.ImageResource().file('system_image01.png'));
            this.imageResurces.push(new ManualTracingTool.ImageResource().file('toolbar_image01.png'));
            this.imageResurces.push(new ManualTracingTool.ImageResource().file('toolbar_image02.png'));
            this.imageResurces.push(new ManualTracingTool.ImageResource().file('toolbar_image03.png'));
            this.imageResurces.push(new ManualTracingTool.ImageResource().file('layerbar_image01.png'));
            this.systemImage = this.imageResurces[1];
            this.subToolImages.push(this.imageResurces[2]);
            this.subToolImages.push(this.imageResurces[3]);
            this.subToolImages.push(this.imageResurces[4]);
            this.layerButtonImage = this.imageResurces[5];
        }
        Main.prototype.onLoad = function () {
            this.initializeDevices();
            this.startLoadingSystemResources();
            this.mainProcessState = MainProcessStateID.SystemResourceLoading;
        };
        Main.prototype.initializeDevices = function () {
            this.resizeWindows();
            this.mainWindow.context = this.mainWindow.canvas.getContext('2d');
            this.editorWindow.context = this.editorWindow.canvas.getContext('2d');
            this.layerWindow.context = this.layerWindow.canvas.getContext('2d');
            this.pickingWindow.context = this.pickingWindow.canvas.getContext('2d');
            this.canvasRender.setContext(this.layerWindow);
            this.canvasRender.setFontSize(18.0);
            if (this.webGLRender.initializeWebGL(this.webglWindow.canvas)) {
                throw ('３Ｄ機能を初期化できませんでした。');
            }
            this.posing3dView.initialize(this.webGLRender, this.pickingWindow);
        };
        // Loading
        Main.prototype.startLoadingSystemResources = function () {
            // Start loading
            this.loadModels(this.modelFile, './res/' + this.modelFile.fileName);
            for (var _i = 0, _a = this.imageResurces; _i < _a.length; _i++) {
                var imageResource = _a[_i];
                this.loadTexture(imageResource, './res/' + imageResource.fileName);
            }
        };
        Main.prototype.processLoadingSystemResources = function () {
            if (!this.modelFile.loaded) {
                return;
            }
            for (var _i = 0, _a = this.imageResurces; _i < _a.length; _i++) {
                var imageResource = _a[_i];
                if (!imageResource.loaded) {
                    return;
                }
            }
            // Loading finished
            var lastURL = window.localStorage.getItem(this.lastFileKey);
            if (StringIsNullOrEmpty(lastURL)) {
                this.document = this.createTestDocumentData();
            }
            else {
                this.document = new ManualTracingTool.DocumentData();
                this.startLoadingDocumentJSON(this.document, lastURL);
            }
            _Main.mainProcessState = MainProcessStateID.InitialDocumentJSONLoading;
        };
        Main.prototype.startLoadingDocumentJSON = function (document, url) {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url);
            xhr.responseType = 'json';
            xhr.addEventListener('load', function (e) {
                var data;
                if (xhr.responseType == 'json') {
                    data = xhr.response;
                }
                else {
                    data = JSON.parse(xhr.response);
                }
                document.documentFrame = data.documentFrame;
                document.rootLayer = data.rootLayer;
                document.loaded = true;
            });
            xhr.send();
        };
        Main.prototype.processLoadingDocumentJSON = function () {
            if (!this.document.loaded) {
                return;
            }
            this.fixLoadedDocumentData(this.document);
            this.startLoadingDocumentResources(this.document);
            _Main.mainProcessState = MainProcessStateID.InitialDocumentResourceLoading;
        };
        Main.prototype.startLoadingDocumentResourcesProcess = function (document) {
            this.startLoadingDocumentResources(document);
            _Main.mainProcessState = MainProcessStateID.DocumentResourceLoading;
        };
        Main.prototype.startLoadingDocumentResources = function (document) {
            this.loadingDocumentImageResources = new List();
            for (var _i = 0, _a = document.rootLayer.childLayers; _i < _a.length; _i++) {
                var layer = _a[_i];
                this.startLoadingDocumentResourcesRecursive(layer, this.loadingDocumentImageResources);
            }
        };
        Main.prototype.startLoadingDocumentResourcesRecursive = function (layer, loadingDocumentImageResources) {
            if (layer.type == ManualTracingTool.LayerTypeID.imageFileReferenceLayer) {
                // Create an image resource
                var ifrLayer = layer;
                if (ifrLayer.imageResource == null) {
                    ifrLayer.imageResource = new ManualTracingTool.ImageResource();
                }
                // Load an image file
                var imageResource = ifrLayer.imageResource;
                if (!imageResource.loaded && !StringIsNullOrEmpty(ifrLayer.imageFilePath)) {
                    imageResource.fileName = ifrLayer.imageFilePath;
                    this.loadTexture(imageResource, imageResource.fileName);
                    loadingDocumentImageResources.push(imageResource);
                }
            }
            for (var _i = 0, _a = layer.childLayers; _i < _a.length; _i++) {
                var chldLayer = _a[_i];
                this.startLoadingDocumentResourcesRecursive(chldLayer, loadingDocumentImageResources);
            }
        };
        Main.prototype.processLoadingDocumentResources = function () {
            for (var _i = 0, _a = this.loadingDocumentImageResources; _i < _a.length; _i++) {
                var imageResource = _a[_i];
                if (!imageResource.loaded) {
                    return;
                }
            }
            // Loading finished
            if (this.mainProcessState == MainProcessStateID.InitialDocumentResourceLoading) {
                this.start();
            }
            else {
                this.mainProcessState = MainProcessStateID.Running;
                this.toolEnv.setRedrawAllWindows();
            }
        };
        Main.prototype.isWhileLoading = function () {
            return (this.mainProcessState == MainProcessStateID.SystemResourceLoading
                || this.mainProcessState == MainProcessStateID.DocumentResourceLoading);
        };
        Main.prototype.loadTexture = function (imageResource, url) {
            var _this = this;
            var image = new Image();
            imageResource.image.imageData = image;
            image.addEventListener('load', function () {
                if (imageResource.isGLTexture) {
                    _this.webGLRender.initializeImageTexture(imageResource.image);
                }
                imageResource.loaded = true;
                imageResource.image.width = image.width;
                imageResource.image.height = image.height;
            });
            image.src = url;
        };
        Main.prototype.loadModels = function (modelFile, url) {
            var _this = this;
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url);
            xhr.responseType = 'json';
            xhr.addEventListener('load', function (e) {
                var data;
                if (xhr.responseType == 'json') {
                    data = xhr.response;
                }
                else {
                    data = JSON.parse(xhr.response);
                }
                for (var _i = 0, _a = data.static_models; _i < _a.length; _i++) {
                    var modelData = _a[_i];
                    var modelResource = new ManualTracingTool.ModelResource();
                    modelResource.modelName = modelData.name;
                    _this.webGLRender.initializeModelBuffer(modelResource.model, modelData.vertices, modelData.indices, 4 * modelData.vertexStride); // 4 = size of float
                    modelFile.modelResources.push(modelResource);
                    modelFile.modelResourceDictionary[modelData.name] = modelResource;
                }
                modelFile.loaded = true;
            });
            xhr.send();
        };
        // Starting ups
        Main.prototype.start = function () {
            this.initializeContext();
            this.initializeTools();
            this.initializeViews();
            this.initializeModals();
            this.mainProcessState = MainProcessStateID.Running;
            this.setCurrentMainTool(ManualTracingTool.MainToolID.drawLine);
            //this.setCurrentMainTool(MainToolID.posing);
            this.setCurrentSelectionTool(this.toolContext.operationUnitID);
            // debug
            this.setCurrentLayer(this.document.rootLayer.childLayers[0]);
            this.toolEnv.updateContext();
            // 初回描画
            this.resizeWindows(); // TODO: これをしないとキャンバスの高さが足りなくなる。最初のリサイズのときは高さがなぜか少し小さい。2回リサイズする必要は本来ないはずなのでなんとかしたい。
            this.updateHeaderButtons();
            this.updateFooterMessage();
            this.toolEnv.setRedrawAllWindows();
            this.setEvents();
        };
        Main.prototype.createTestDocumentData = function () {
            var saveData = window.localStorage.getItem(this.tempFileNameKey);
            if (saveData) {
                var document_1 = JSON.parse(saveData);
                document_1.loaded = true;
                return document_1;
            }
            var document = new ManualTracingTool.DocumentData();
            var rootLayer = this.document.rootLayer;
            rootLayer.type = ManualTracingTool.LayerTypeID.rootLayer;
            {
                var layer1 = new ManualTracingTool.VectorLayer();
                layer1.name = 'layer1';
                rootLayer.childLayers.push(layer1);
                var group1 = new ManualTracingTool.VectorGroup();
                layer1.groups.push(group1);
            }
            {
                var layer1 = new ManualTracingTool.GroupLayer();
                layer1.name = 'group1';
                rootLayer.childLayers.push(layer1);
                var layer2 = new ManualTracingTool.VectorLayer();
                layer2.name = 'child1';
                layer1.childLayers.push(layer2);
                var group2 = new ManualTracingTool.VectorGroup();
                layer2.groups.push(group2);
            }
            {
                var layer1 = new ManualTracingTool.VectorLayer();
                layer1.name = 'background';
                rootLayer.childLayers.push(layer1);
                var group1 = new ManualTracingTool.VectorGroup();
                layer1.groups.push(group1);
            }
            {
                var layer1 = new ManualTracingTool.PosingLayer();
                layer1.name = 'posing1';
                rootLayer.childLayers.push(layer1);
            }
            document.loaded = true;
        };
        Main.prototype.fixLoadedDocumentData = function (document) {
            this.fixLoadedDocumentData_LayerRecursive(document.rootLayer);
        };
        Main.prototype.fixLoadedDocumentData_LayerRecursive = function (layer) {
            if (layer.type == ManualTracingTool.LayerTypeID.vectorLayer) {
                var vectorLayer = layer;
                for (var _i = 0, _a = vectorLayer.groups; _i < _a.length; _i++) {
                    var group = _a[_i];
                    for (var _b = 0, _c = group.lines; _b < _c.length; _b++) {
                        var line = _c[_b];
                        line.modifyFlag = ManualTracingTool.VectorLineModifyFlagID.none;
                        for (var _d = 0, _e = line.points; _d < _e.length; _d++) {
                            var point = _e[_d];
                            point.modifyFlag = ManualTracingTool.LinePointModifyFlagID.none;
                            point.adjustingLocation = vec3.create();
                            vec3.copy(point.adjustingLocation, point.location);
                            point.tempLocation = vec3.create();
                            point.adjustingLineWidth = point.lineWidth;
                            if (point.lineWidth == undefined) {
                                point.lineWidth = 1.0;
                            }
                            if (point["adjustedLocation"] != undefined) {
                                delete point["adjustedLocation"];
                            }
                        }
                    }
                }
            }
            else if (layer.type == ManualTracingTool.LayerTypeID.imageFileReferenceLayer) {
                var ifrLayer = layer;
                ifrLayer.imageResource = null;
                ifrLayer.adjustingLocation = vec3.fromValues(0.0, 0.0, 0.0);
                ifrLayer.adjustingRotation = vec3.fromValues(0.0, 0.0, 0.0);
                ifrLayer.adjustingScale = vec3.fromValues(1.0, 1.0, 1.0);
                if (ifrLayer.location == undefined) {
                    ifrLayer.location = vec3.fromValues(0.0, 0.0, 0.0);
                    ifrLayer.rotation = vec3.fromValues(0.0, 0.0, 0.0);
                    ifrLayer.scale = vec3.fromValues(1.0, 1.0, 1.0);
                }
            }
            for (var _f = 0, _g = layer.childLayers; _f < _g.length; _f++) {
                var childLayer = _g[_f];
                this.fixLoadedDocumentData_LayerRecursive(childLayer);
            }
        };
        Main.prototype.fixSaveDocumentData = function (document) {
            this.fixSaveDocumentData_LayerRecursive(document.rootLayer);
        };
        Main.prototype.fixSaveDocumentData_LayerRecursive = function (layer) {
            if (layer.type == ManualTracingTool.LayerTypeID.vectorLayer) {
                var vectorLayer = layer;
                for (var _i = 0, _a = vectorLayer.groups; _i < _a.length; _i++) {
                    var group = _a[_i];
                    for (var _b = 0, _c = group.lines; _b < _c.length; _b++) {
                        var line = _c[_b];
                        for (var _d = 0, _e = line.points; _d < _e.length; _d++) {
                            var point = _e[_d];
                            delete point.adjustingLocation;
                            delete point.tempLocation;
                            delete point.adjustingLineWidth;
                        }
                    }
                }
            }
            else if (layer.type == ManualTracingTool.LayerTypeID.imageFileReferenceLayer) {
                var ifrLayer = layer;
                delete ifrLayer.imageResource;
                delete ifrLayer.adjustingLocation;
                delete ifrLayer.adjustingRotation;
                delete ifrLayer.adjustingScale;
            }
            for (var _f = 0, _g = layer.childLayers; _f < _g.length; _f++) {
                var childLayer = _g[_f];
                this.fixSaveDocumentData_LayerRecursive(childLayer);
            }
        };
        Main.prototype.initializeContext = function () {
            this.toolContext = new ManualTracingTool.ToolContext();
            this.toolContext.mainWindow = this.mainWindow;
            this.toolContext.pickingWindow = this.pickingWindow;
            this.toolContext.posing3DView = this.posing3dView;
            this.toolContext.posing3DLogic = this.posing3DLogic;
            this.toolContext.document = this.document;
            this.toolContext.commandHistory = new ManualTracingTool.CommandHistory();
            this.toolContext.mainEditor = this;
        };
        Main.prototype.initializeViews = function () {
            this.mainWindow.centerLocationRate[0] = 0.5;
            this.mainWindow.centerLocationRate[1] = 0.5;
            this.collectLayerWindowButtons();
            this.collectLayerWindowItems();
        };
        Main.prototype.initializeModals = function () {
            this.setRadioElementIntValue(this.ID.newLayerCommandOptionModal_layerType, ManualTracingTool.LayerTypeID.vectorLayer);
        };
        Main.prototype.initializeTools = function () {
            // Resoures
            this.posing3dView.storeResources(this.modelFile, this.imageResurces);
            // Constructs main tools and sub tools structure
            this.mainTools.push(new ManualTracingTool.MainTool().id(ManualTracingTool.MainToolID.none));
            this.mainTools.push(new ManualTracingTool.MainTool().id(ManualTracingTool.MainToolID.drawLine)
                .subToolImg(this.subToolImages[0])
                .subTool(this.tool_DrawLine)
                .subTool(this.tool_EditImageFileReference));
            this.mainTools.push(new ManualTracingTool.MainTool().id(ManualTracingTool.MainToolID.scratchLine)
                .subToolImg(this.subToolImages[1])
                .subTool(this.tool_ScratchLine)
                .subTool(this.tool_ExtrudeLine)
                .subTool(this.tool_ScratchLineWidth)
                .subTool(this.tool_ResampleSegment));
            this.mainTools.push(new ManualTracingTool.MainTool().id(ManualTracingTool.MainToolID.posing)
                .subToolImg(this.subToolImages[2])
                .subTool(this.tool_Posing3d_LocateHead)
                .subTool(this.tool_Posing3d_RotateHead)
                .subTool(this.tool_Posing3d_LocateBody)
                .subTool(this.tool_Posing3d_RatateBody)
                .subTool(this.tool_Posing3d_LocateRightArm1)
                .subTool(this.tool_Posing3d_LocateRightArm2)
                .subTool(this.tool_Posing3d_LocateLeftArm1)
                .subTool(this.tool_Posing3d_LocateLeftArm2)
                .subTool(this.tool_Posing3d_LocateRightLeg1)
                .subTool(this.tool_Posing3d_LocateRightLeg2)
                .subTool(this.tool_Posing3d_LocateLeftLeg1)
                .subTool(this.tool_Posing3d_LocateLeftLeg2)
                .subTool(this.tool_Posing3d_TwistHead));
            // Modal tools
            this.vectorLayer_ModalTools[ModalToolID.none] = null;
            this.vectorLayer_ModalTools[ModalToolID.grabMove] = this.tool_Transform_Lattice_GrabMove;
            this.vectorLayer_ModalTools[ModalToolID.ratate] = this.tool_Transform_Lattice_Rotate;
            this.vectorLayer_ModalTools[ModalToolID.scale] = this.tool_Transform_Lattice_Scale;
            this.imageFileReferenceLayer_ModalTools[ModalToolID.none] = null;
            this.imageFileReferenceLayer_ModalTools[ModalToolID.grabMove] = this.tool_Transform_ReferenceImage_GrabMove;
            this.imageFileReferenceLayer_ModalTools[ModalToolID.ratate] = this.tool_Transform_ReferenceImage_Rotate;
            this.imageFileReferenceLayer_ModalTools[ModalToolID.scale] = this.tool_Transform_ReferenceImage_Scale;
            // Selection tools
            this.selectionTools[ManualTracingTool.OperationUnitID.none] = null;
            this.selectionTools[ManualTracingTool.OperationUnitID.linePoint] = this.tool_LinePointBrushSelect;
            this.selectionTools[ManualTracingTool.OperationUnitID.lineSegment] = this.tool_LineSegmentBrushSelect;
            this.selectionTools[ManualTracingTool.OperationUnitID.line] = this.tool_LineBrushSelect;
            // Constructs tool environment variables
            this.toolEnv = new ManualTracingTool.ToolEnvironment(this.toolContext);
            this.toolDrawEnv = new ManualTracingTool.ToolDrawingEnvironment();
            this.toolDrawEnv.setEnvironment(this, this.canvasRender, this.drawStyle);
            //this.currentTool = this.tool_DrawLine;
            //this.currentTool = this.tool_AddPoint;
            //this.currentTool = this.tool_ScratchLine;
            this.currentTool = this.tool_Posing3d_LocateHead;
            // TODO: ツールを作るたびに忘れるのでなんとかしる
            this.tool_DrawLine.resamplingUnitLength = this.toolContext.resamplingUnitLength;
            this.tool_ScratchLine.resamplingUnitLength = this.toolContext.resamplingUnitLength * 1.5;
            this.tool_ExtrudeLine.resamplingUnitLength = this.toolContext.resamplingUnitLength * 1.5;
            this.tool_ScratchLineWidth.resamplingUnitLength = this.toolContext.resamplingUnitLength * 1.5;
            this.tool_ResampleSegment.resamplingUnitLength = this.toolContext.resamplingUnitLength;
        };
        Main.prototype.setEvents = function () {
            var _this = this;
            this.editorWindow.canvas.addEventListener('mousedown', function (e) {
                _this.getMouseInfo(e, false, _this.mainWindow);
                _this.mainWindow_mousedown();
                e.preventDefault();
            });
            this.editorWindow.canvas.addEventListener('mousemove', function (e) {
                _this.getMouseInfo(e, false, _this.mainWindow);
                _this.mainWindow_mousemove();
                e.preventDefault();
            });
            this.editorWindow.canvas.addEventListener('mouseup', function (e) {
                _this.getMouseInfo(e, true, _this.mainWindow);
                _this.mainWindow_mouseup();
                e.preventDefault();
            });
            this.editorWindow.canvas.addEventListener('touchstart', function (e) {
                _this.getTouchInfo(e, true, false, _this.mainWindow);
                _this.mainWindow_mousedown();
                e.preventDefault();
            });
            this.editorWindow.canvas.addEventListener('touchmove', function (e) {
                _this.getTouchInfo(e, false, false, _this.mainWindow);
                _this.mainWindow_mousemove();
                e.preventDefault();
            });
            this.editorWindow.canvas.addEventListener('touchend', function (e) {
                _this.getTouchInfo(e, false, true, _this.mainWindow);
                _this.mainWindow_mouseup();
                e.preventDefault();
            });
            this.editorWindow.canvas.addEventListener('mousewheel', function (e) {
                _this.getWheelInfo(e);
                _this.editorWindow_mousewheel();
                e.preventDefault();
            });
            this.layerWindow.canvas.addEventListener('mousedown', function (e) {
                _this.getMouseInfo(e, false, _this.layerWindow);
                _this.layerWindow_mousedown();
                e.preventDefault();
            });
            document.addEventListener('keydown', function (e) {
                _this.document_keydown(e);
            });
            document.addEventListener('keyup', function (e) {
                _this.document_keyup(e);
            });
            window.addEventListener('resize', function (e) {
                _this.htmlWindow_resize(e);
            });
            window.addEventListener('contextmenu', function (e) {
                return _this.htmlWindow_contextmenu(e);
            });
            // Menu buttons
            this.getElement(this.ID.menu_btnDrawTool).addEventListener('mousedown', function (e) {
                _this.setCurrentMainTool(ManualTracingTool.MainToolID.drawLine);
                _this.toolEnv.setRedrawMainWindowEditorWindow();
                _this.toolEnv.setRedrawLayerWindow();
                e.preventDefault();
            });
            this.getElement(this.ID.menu_btnScratchTool).addEventListener('mousedown', function (e) {
                _this.setCurrentMainTool(ManualTracingTool.MainToolID.scratchLine);
                _this.toolEnv.setRedrawMainWindowEditorWindow();
                _this.toolEnv.setRedrawLayerWindow();
                e.preventDefault();
            });
            this.getElement(this.ID.menu_btnPoseTool).addEventListener('mousedown', function (e) {
                _this.setCurrentMainTool(ManualTracingTool.MainToolID.posing);
                _this.toolEnv.setRedrawMainWindowEditorWindow();
                _this.toolEnv.setRedrawLayerWindow();
                e.preventDefault();
            });
            this.getElement(this.ID.menu_btnOperationOption).addEventListener('mousedown', function (e) {
                _this.openOperationOptionModal();
                e.preventDefault();
            });
            // Modal window
            document.addEventListener('custombox:content:close', function () {
                _this.onModalWindowClosed();
            });
            this.setEvents_ModalCloseButton(this.ID.openFileDialogModal_ok);
            this.setEvents_ModalCloseButton(this.ID.openFileDialogModal_cancel);
            this.setEvents_ModalCloseButton(this.ID.newLayerCommandOptionModal_ok);
            this.setEvents_ModalCloseButton(this.ID.newLayerCommandOptionModal_cancel);
        };
        Main.prototype.setEvents_ModalCloseButton = function (id) {
            var _this = this;
            this.getElement(id).addEventListener('click', function (e) {
                _this.currentModalDialogResult = id;
                _this.closeModal();
                e.preventDefault();
            });
        };
        // Continuous processes
        Main.prototype.run = function () {
        };
        // Events
        Main.prototype.mainWindow_mousedown = function () {
            if (!this.mainProcessState) {
                return;
            }
            var context = this.toolContext;
            this.toolEnv.updateContext();
            // Execute current tool
            if (this.isModalToolRunning()) {
                this.currentTool.mouseDown(this.toolMouseEvent, this.toolEnv);
            }
            else if (this.toolEnv.isDrawMode()) {
                this.currentTool.mouseDown(this.toolMouseEvent, this.toolEnv);
            }
            else if (this.toolEnv.isSelectMode()) {
                this.currentSelectTool.mouseDown(this.toolMouseEvent, this.toolEnv);
            }
            // View operation
            if (this.toolMouseEvent.isRightButtonPressing()) {
                this.mainWindow_MouseViewOperationStart();
            }
            else {
                this.mainWindow_MouseViewOperationEnd();
            }
            if (this.toolEnv.needsDrawOperatorCursor() && this.toolEnv.isCtrlKeyPressing()) {
                vec3.copy(this.toolContext.operatorCursor.location, this.toolMouseEvent.location);
                this.toolEnv.setRedrawEditorWindow();
            }
        };
        Main.prototype.mainWindow_MouseViewOperationStart = function () {
            this.toolMouseEvent.isMouseDragging = true;
            mat4.copy(this.dragBeforeTransformMatrix, this.invView2DMatrix);
            vec3.copy(this.dragBeforeViewLocation, this.mainWindow.viewLocation);
            vec3.copy(this.toolMouseEvent.mouseDownLocation, this.toolMouseEvent.location);
            vec3.set(this.toolMouseEvent.mouseMovedVector, 0.0, 0.0, 0.0);
        };
        Main.prototype.mainWindow_MouseViewOperationEnd = function () {
            this.toolMouseEvent.isMouseDragging = false;
        };
        Main.prototype.mainWindow_mousemove = function () {
            if (this.isWhileLoading()) {
                return;
            }
            var context = this.toolContext;
            this.toolEnv.updateContext();
            // Execute current tool
            if (this.isModalToolRunning()) {
                if (!this.toolMouseEvent.isMouseDragging) {
                    this.currentTool.mouseMove(this.toolMouseEvent, this.toolEnv);
                }
            }
            else if (this.toolEnv.isDrawMode()) {
                this.currentTool.mouseMove(this.toolMouseEvent, this.toolEnv);
            }
            else if (this.toolEnv.isSelectMode()) {
                var isHitChanged = this.mousemoveHittest(this.toolMouseEvent.location[0], this.toolMouseEvent.location[1], this.toolEnv.mouseCursorViewRadius, false);
                if (isHitChanged) {
                    this.toolEnv.setRedrawMainWindow();
                }
                this.currentSelectTool.mouseMove(this.toolMouseEvent, this.toolEnv);
            }
            // View operation
            if (this.toolMouseEvent.isMouseDragging) {
                vec3.set(this.tempVec3, this.toolMouseEvent.offsetX, this.toolMouseEvent.offsetY, 0.0);
                vec3.transformMat4(this.tempVec3, this.tempVec3, this.dragBeforeTransformMatrix);
                vec3.subtract(this.toolMouseEvent.mouseMovedVector, this.toolMouseEvent.mouseDownLocation, this.tempVec3);
                vec3.add(this.mainWindow.viewLocation, this.dragBeforeViewLocation, this.toolMouseEvent.mouseMovedVector);
                this.toolEnv.setRedrawMainWindowEditorWindow();
                this.toolEnv.setRedrawWebGLWindow();
            }
        };
        Main.prototype.mainWindow_mouseup = function () {
            if (this.isWhileLoading()) {
                return;
            }
            var context = this.toolContext;
            this.toolEnv.updateContext();
            // Draw mode
            if (this.toolEnv.isDrawMode()) {
                this.currentTool.mouseUp(this.toolMouseEvent, this.toolEnv);
            }
            else if (this.toolEnv.isSelectMode()) {
                this.currentSelectTool.mouseUp(this.toolMouseEvent, this.toolEnv);
            }
            this.mainWindow_MouseViewOperationEnd();
        };
        Main.prototype.layerWindow_mousedown = function () {
            if (this.isWhileLoading()) {
                return;
            }
            var context = this.toolContext;
            var layerWindow = this.layerWindow;
            this.toolEnv.updateContext();
            var doubleClicked = this.hundleDoubleClick(layerWindow, this.toolMouseEvent.offsetX, this.toolMouseEvent.offsetY);
            var clickedX = this.toolMouseEvent.location[0];
            var clickedY = this.toolMouseEvent.location[1];
            if (this.toolMouseEvent.location[1] <= layerWindow.layerItemButtonButtom) {
                // Layer window button click
                this.layerWindow_mousedown_LayerItemButton(clickedX, clickedY, doubleClicked);
            }
            else if (this.toolMouseEvent.location[1] < layerWindow.layerWindowPainY) {
                // Layer window item click
                this.layerWindow_mousedown_LayerItem(clickedX, clickedY, doubleClicked);
            }
            else {
                // Sub tool click
                this.layerWindow_mousedown_Subtool(clickedX, clickedY, doubleClicked);
            }
        };
        Main.prototype.layerWindow_mousedown_LayerItemButton = function (clickedX, clickedY, doubleClicked) {
            var hitedButton = this.hitTestLayout(this.layerWindowButtons, clickedX, clickedY);
            if (hitedButton != null) {
                // Select command
                var layerCommand = null;
                if (hitedButton.buttonID == LayerWindowButtonID.addLayer) {
                    layerCommand = new ManualTracingTool.Command_Layer_AddVectorLayerToCurrentPosition();
                }
                else if (hitedButton.buttonID == LayerWindowButtonID.deleteLayer) {
                    layerCommand = new ManualTracingTool.Command_Layer_Delete();
                }
                else if (hitedButton.buttonID == LayerWindowButtonID.moveUp) {
                    layerCommand = new ManualTracingTool.Command_Layer_MoveUp();
                }
                else if (hitedButton.buttonID == LayerWindowButtonID.moveDown) {
                    layerCommand = new ManualTracingTool.Command_Layer_MoveDown();
                }
                if (layerCommand == null) {
                    return;
                }
                // Execute command
                this.executeLayerCommand(layerCommand);
            }
        };
        Main.prototype.setLayerCommandParameters = function (layerCommand, currentLayerWindowItem) {
            // Collects layer items for command
            var currentLayer = currentLayerWindowItem.layer;
            var currentLayerParent = currentLayerWindowItem.parentLayer;
            var previousLayer = null;
            var previousLayerParent = null;
            if (currentLayerWindowItem.layer.type == ManualTracingTool.LayerTypeID.groupLayer) {
                if (currentLayerWindowItem.previousSiblingItem != null) {
                    previousLayer = currentLayerWindowItem.previousSiblingItem.layer;
                    previousLayerParent = currentLayerWindowItem.previousSiblingItem.parentLayer;
                }
            }
            else {
                if (currentLayerWindowItem.previousItem != null) {
                    previousLayer = currentLayerWindowItem.previousItem.layer;
                    previousLayerParent = currentLayerWindowItem.previousItem.parentLayer;
                }
            }
            var nextLayer = null;
            var nextLayerParent = null;
            if (currentLayerWindowItem.layer.type == ManualTracingTool.LayerTypeID.groupLayer) {
                if (currentLayerWindowItem.nextSiblingItem != null) {
                    nextLayer = currentLayerWindowItem.nextSiblingItem.layer;
                    nextLayerParent = currentLayerWindowItem.nextSiblingItem.parentLayer;
                }
            }
            else {
                if (currentLayerWindowItem.nextItem != null) {
                    nextLayer = currentLayerWindowItem.nextItem.layer;
                    nextLayerParent = currentLayerWindowItem.nextItem.parentLayer;
                }
            }
            layerCommand.setPrameters(currentLayer, currentLayerParent, previousLayer, previousLayerParent, nextLayer, nextLayerParent);
        };
        Main.prototype.executeLayerCommand = function (layerCommand) {
            var currentLayerWindowItem = this.findCurrentLayerLayerWindowItem();
            if (currentLayerWindowItem == null) {
                return;
            }
            this.setLayerCommandParameters(layerCommand, currentLayerWindowItem);
            if (layerCommand.isAvailable(this.toolEnv)) {
                layerCommand.execute(this.toolEnv);
                this.toolContext.commandHistory.addCommand(layerCommand);
            }
        };
        Main.prototype.layerWindow_mousedown_LayerItem = function (clickedX, clickedY, doubleClicked) {
            if (this.layerWindowItems.length == 0) {
                return;
            }
            var firstItem = this.layerWindowItems[0];
            var selectedIndex = Math.floor((clickedY - firstItem.top) / firstItem.getHeight());
            if (selectedIndex >= 0 && selectedIndex < this.layerWindowItems.length) {
                var selectedItem = this.layerWindowItems[selectedIndex];
                var selectedLayer = selectedItem.layer;
                if (clickedX <= selectedItem.textLeft) {
                    selectedItem.layer.isVisible = !selectedItem.layer.isVisible;
                    this.toolEnv.setRedrawMainWindowEditorWindow();
                }
                else {
                    if (doubleClicked) {
                        // Layer property
                        this.openLayerPropertyModal(selectedLayer, selectedItem);
                    }
                    else {
                        // Select layer content
                        this.setCurrentLayer(selectedLayer);
                        this.toolEnv.setRedrawMainWindowEditorWindow();
                    }
                }
            }
            this.toolEnv.setRedrawLayerWindow();
        };
        Main.prototype.layerWindow_mousedown_Subtool = function (clickedX, clickedY, doubleClicked) {
            var context = this.toolContext;
            if (context.mainToolID == ManualTracingTool.MainToolID.none || this.subToolViewItems.length == 0) {
                return;
            }
            var firstItem = this.subToolViewItems[0];
            var selectedIndex = Math.floor((clickedY - firstItem.top) / (firstItem.getHeight()));
            if (selectedIndex < 0 || selectedIndex >= this.subToolViewItems.length) {
                return;
            }
            var viewItem = this.subToolViewItems[selectedIndex];
            var tool = viewItem.tool;
            if (tool.isAvailable(this.toolEnv)) {
                // Change current sub tool
                this.setCurrentSubTool(selectedIndex);
                this.updateFooterMessage();
                this.toolEnv.setRedrawMainWindowEditorWindow();
                this.toolEnv.setRedrawLayerWindow();
                // Option button click
                for (var _i = 0, _a = viewItem.buttons; _i < _a.length; _i++) {
                    var button = _a[_i];
                    if (clickedX >= button.left && clickedX <= button.right
                        && clickedY >= button.top && clickedY <= button.bottom) {
                        var inpuSideID = tool.getInputSideID(button.index, this.toolEnv);
                        if (tool.setInputSide(button.index, inpuSideID, this.toolEnv)) {
                            this.toolEnv.setRedrawMainWindowEditorWindow();
                            this.toolEnv.setRedrawLayerWindow();
                        }
                    }
                }
            }
        };
        Main.prototype.editorWindow_mousewheel = function () {
            if (this.isWhileLoading()) {
                return;
            }
            // View operation
            if (this.toolMouseEvent.wheelDelta != 0.0
                && !this.toolMouseEvent.isMouseDragging) {
                this.mainWindow.addViewScale(this.toolMouseEvent.wheelDelta * 0.3);
                this.toolEnv.setRedrawMainWindowEditorWindow();
                this.toolEnv.setRedrawWebGLWindow();
            }
        };
        Main.prototype.document_keydown = function (e) {
            if (this.isWhileLoading()) {
                return;
            }
            var context = this.toolContext;
            this.toolContext.shiftKey = e.shiftKey;
            this.toolContext.altKey = e.altKey;
            this.toolContext.ctrlKey = e.ctrlKey;
            this.toolEnv.updateContext();
            if (e.key == 'Tab') {
                // Change mode
                if (this.toolEnv.isDrawMode()) {
                    context.editMode = ManualTracingTool.EditModeID.selectMode;
                }
                else {
                    context.editMode = ManualTracingTool.EditModeID.drawMode;
                }
                /// Update footer message
                this.updateFooterMessage();
                this.toolEnv.setRedrawMainWindowEditorWindow();
                return e.preventDefault();
            }
            if (e.key == 'b') {
                if (this.toolEnv.isDrawMode()) {
                    this.setCurrentMainTool(ManualTracingTool.MainToolID.drawLine);
                    this.setCurrentSubTool(DrawLineToolSubToolID.drawLine);
                    this.updateFooterMessage();
                    this.toolEnv.setRedrawMainWindowEditorWindow();
                    this.toolEnv.setRedrawLayerWindow();
                }
                return;
            }
            if (e.key == 'e') {
                if (this.toolEnv.isDrawMode()) {
                    this.setCurrentMainTool(ManualTracingTool.MainToolID.scratchLine);
                    this.setCurrentSubTool(ScrathLineToolSubToolID.scratchLine);
                    this.updateFooterMessage();
                    this.toolEnv.setRedrawMainWindowEditorWindow();
                    this.toolEnv.setRedrawLayerWindow();
                }
                return;
            }
            if (e.key == 'p') {
                if (this.toolEnv.isDrawMode()) {
                    this.setCurrentMainTool(ManualTracingTool.MainToolID.posing);
                    if (this.currentTool == this.tool_Posing3d_LocateHead) {
                        this.setCurrentSubTool(ManualTracingTool.Posing3DSubToolID.rotateHead);
                    }
                    else {
                        this.setCurrentSubTool(ManualTracingTool.Posing3DSubToolID.locateHead);
                    }
                    this.updateFooterMessage();
                    this.toolEnv.setRedrawMainWindow();
                    this.toolEnv.setRedrawLayerWindow();
                }
                return;
            }
            if (e.key == 'z') {
                this.toolContext.commandHistory.undo(this.toolEnv);
                this.toolEnv.setRedrawMainWindow();
                return;
            }
            if (e.key == 'y') {
                this.toolContext.commandHistory.redo(this.toolEnv);
                this.toolEnv.setRedrawMainWindow();
                return;
            }
            if (e.key == 'Delete' || e.key == 'x') {
                if (this.toolEnv.isSelectMode()) {
                    if (this.toolContext.currentLayer != null
                        && this.toolContext.currentLayer.type == ManualTracingTool.LayerTypeID.vectorLayer) {
                        var command = new ManualTracingTool.Command_DeletePoints();
                        if (command.collectEditTargets((this.toolContext.currentLayer))) {
                            command.execute(this.toolEnv);
                            this.toolContext.commandHistory.addCommand(command);
                        }
                        this.toolEnv.setRedrawMainWindow();
                    }
                }
                return;
            }
            if (e.key == 's') {
                if (this.toolEnv.isCtrlKeyPressing()) {
                    var copy = JSON.parse(JSON.stringify(this.document));
                    this.fixSaveDocumentData(copy);
                    window.localStorage.setItem(this.tempFileNameKey, JSON.stringify(copy));
                    e.preventDefault();
                    return;
                }
            }
            if (e.key == 'Home' || e.key == 'q') {
                this.mainWindow.viewLocation[0] = 0.0;
                this.mainWindow.viewLocation[1] = 0.0;
                this.mainWindow.viewScale = 1.0;
                this.mainWindow.viewRotation = 0.0;
                this.toolEnv.setRedrawMainWindowEditorWindow();
                e.preventDefault();
                return;
            }
            if (e.key == 't' || e.key == 'r') {
                if (this.toolEnv.isDrawMode()) {
                    var rot = 10.0;
                    if (e.key == 't') {
                        rot = -rot;
                    }
                    this.mainWindow.viewRotation += rot;
                    if (this.mainWindow.viewRotation >= 360.0) {
                        this.mainWindow.viewRotation -= 360.0;
                    }
                    if (this.mainWindow.viewRotation <= 0.0) {
                        this.mainWindow.viewRotation += 360.0;
                    }
                    this.toolEnv.setRedrawMainWindowEditorWindow();
                    e.preventDefault();
                    return;
                }
            }
            if (e.key == 'f' || e.key == 'd') {
                var addScale = 0.1 * this.drawStyle.viewZoomAdjustingSpeedRate;
                if (e.key == 'd') {
                    addScale = -addScale;
                }
                this.mainWindow.addViewScale(addScale);
                this.toolEnv.setRedrawMainWindowEditorWindow();
                e.preventDefault();
                return;
            }
            if (e.key == 'ArrowLeft' || e.key == 'ArrowRight' || e.key == 'ArrowUp' || e.key == 'ArrowDown') {
                var x = 0.0;
                var y = 0.0;
                if (e.key == 'ArrowLeft') {
                    x = -10.0;
                }
                if (e.key == 'ArrowRight') {
                    x = 10.0;
                }
                if (e.key == 'ArrowUp') {
                    y = -10.0;
                }
                if (e.key == 'ArrowDown') {
                    y = 10.0;
                }
                this.mainWindow.calculateViewUnitMatrix(this.view2DMatrix);
                mat4.invert(this.invView2DMatrix, this.view2DMatrix);
                vec3.set(this.tempVec3, x, y, 0.0);
                vec3.transformMat4(this.tempVec3, this.tempVec3, this.invView2DMatrix);
                vec3.add(this.mainWindow.viewLocation, this.mainWindow.viewLocation, this.tempVec3);
                var leftLimit = this.mainWindow.width * (-0.5);
                var rightLimit = this.mainWindow.width * 1.5;
                var topLimit = this.mainWindow.height * (-0.5);
                var bottomLimit = this.mainWindow.height * 1.5;
                if (this.mainWindow.viewLocation[0] < leftLimit) {
                    this.mainWindow.viewLocation[0] = leftLimit;
                }
                if (this.mainWindow.viewLocation[0] > rightLimit) {
                    this.mainWindow.viewLocation[0] = rightLimit;
                }
                if (this.mainWindow.viewLocation[1] < topLimit) {
                    this.mainWindow.viewLocation[1] = topLimit;
                }
                if (this.mainWindow.viewLocation[1] > bottomLimit) {
                    this.mainWindow.viewLocation[1] = bottomLimit;
                }
                this.toolEnv.setRedrawMainWindowEditorWindow();
                e.preventDefault();
                return;
            }
            if (e.key == ' ') {
                this.mainWindow_MouseViewOperationStart();
                e.preventDefault();
                return;
            }
            if (e.key == 'a') {
                if (this.toolEnv.isSelectMode()) {
                    this.tool_SelectAllPoints.execute(this.toolEnv);
                    e.preventDefault();
                }
            }
            if (e.key == 'g' || e.key == 'r' || e.key == 's') {
                var modalToolID = ModalToolID.grabMove;
                if (e.key == 'r') {
                    modalToolID = ModalToolID.ratate;
                }
                else if (e.key == 's') {
                    modalToolID = ModalToolID.scale;
                }
                if (this.toolEnv.isDrawMode()) {
                    if (this.toolEnv.isCurrentLayerVectorLayer()) {
                        this.currentTool.keydown(e, this.toolEnv);
                    }
                    else if (this.toolEnv.isCurrentLayerImageFileReferenceLayer()) {
                        this.startModalTool(modalToolID);
                    }
                }
                else {
                    this.startModalTool(modalToolID);
                }
                e.preventDefault();
            }
            if (e.key == 'Escape') {
                if (this.isModalToolRunning()) {
                    this.cancelModalTool();
                }
            }
            if (e.key == 'Enter') {
                this.currentTool.keydown(e, this.toolEnv);
            }
            if (e.key == '1') {
                this.openOperationOptionModal();
            }
            if (e.key == '2') {
                this.openNewLayerCommandOptionModal();
            }
            if (e.key == 'o') {
                this.currentTool.keydown(e, this.toolEnv);
            }
        };
        Main.prototype.document_keyup = function (e) {
            this.toolContext.shiftKey = e.shiftKey;
            this.toolContext.altKey = e.altKey;
            this.toolContext.ctrlKey = e.ctrlKey;
            if (e.key == ' ') {
                this.mainWindow_MouseViewOperationEnd();
            }
        };
        Main.prototype.htmlWindow_resize = function (e) {
            this.resizeWindows();
            this.toolEnv.setRedrawMainWindowEditorWindow();
            this.toolEnv.setRedrawLayerWindow();
        };
        Main.prototype.htmlWindow_contextmenu = function (e) {
            if (e.preventDefault) {
                e.preventDefault();
            }
            else if (e.returnValue) {
                e.returnValue = false;
            }
            return false;
        };
        // Tools and context operations
        Main.prototype.getCurrentMainTool = function () {
            return this.mainTools[this.toolContext.mainToolID];
        };
        Main.prototype.setCurrentMainTool = function (id) {
            var isChanged = (this.toolContext.mainToolID != id);
            this.toolContext.mainToolID = id;
            var mainTool = this.getCurrentMainTool();
            this.setCurrentSubTool(mainTool.currentSubToolIndex);
            if (isChanged) {
                this.collectSubToolViewItems();
                this.caluculateLayerWindowLayout(this.layerWindow);
                this.toolContext.redrawHeaderWindow = true;
            }
        };
        Main.prototype.setCurrentSubTool = function (subToolIndex) {
            this.cancelModalTool();
            var mainTool = this.getCurrentMainTool();
            if (this.toolContext.mainToolID != subToolIndex) {
                this.toolContext.redrawFooterWindow = true;
            }
            mainTool.currentSubToolIndex = subToolIndex;
            this.toolContext.subToolIndex = subToolIndex;
            this.currentTool = mainTool.subTools[subToolIndex];
        };
        Main.prototype.setCurrentSelectionTool = function (operationUnitID) {
            this.currentSelectTool = this.selectionTools[(operationUnitID)];
        };
        Main.prototype.setCurrentLayer = function (layer) {
            this.toolContext.currentLayer = layer;
            if (layer.type == ManualTracingTool.LayerTypeID.vectorLayer) {
                var vectorLayer = layer;
                this.toolContext.currentVectorLayer = vectorLayer;
                this.toolContext.currentVectorGroup = vectorLayer.groups[0];
            }
            else {
                this.toolContext.currentVectorLayer = null;
                this.toolContext.currentVectorGroup = null;
            }
            if (layer.type == ManualTracingTool.LayerTypeID.posingLayer) {
                var posingLayer = layer;
                this.toolContext.currentPosingData = posingLayer.posingData;
                this.toolContext.currentPosingModel = posingLayer.posingModel;
            }
            else {
                this.toolContext.currentPosingData = null;
            }
            if (layer.type == ManualTracingTool.LayerTypeID.imageFileReferenceLayer) {
                var imageFileReferenceLayer = layer;
                this.toolContext.currentImageFileReferenceLayer = imageFileReferenceLayer;
            }
            else {
                this.toolContext.currentImageFileReferenceLayer = null;
            }
            for (var _i = 0, _a = this.layerWindowItems; _i < _a.length; _i++) {
                var item = _a[_i];
                item.layer.isSelected = false;
            }
            layer.isSelected = true;
        };
        Main.prototype.startModalTool = function (modalToolID) {
            var modalTool = null;
            if (this.toolEnv.isCurrentLayerVectorLayer()) {
                modalTool = this.vectorLayer_ModalTools[modalToolID];
            }
            else if (this.toolEnv.isCurrentLayerImageFileReferenceLayer()) {
                modalTool = this.imageFileReferenceLayer_ModalTools[modalToolID];
            }
            if (modalTool == null) {
                return;
            }
            var available = modalTool.prepareModal(this.toolMouseEvent, this.toolEnv);
            if (!available) {
                return;
            }
            modalTool.startModal(this.toolEnv);
            this.modalBeforeTool = this.currentTool;
            this.currentModalTool = modalTool;
            this.currentTool = modalTool;
        };
        Main.prototype.endModalTool = function () {
            this.toolEnv.updateContext();
            this.currentModalTool.endModal(this.toolEnv);
            this.setModalToolBefore();
            this.toolEnv.setRedrawMainWindowEditorWindow();
        };
        Main.prototype.cancelModalTool = function () {
            if (!this.isModalToolRunning()) {
                return;
            }
            this.toolEnv.updateContext();
            this.currentModalTool.cancelModal(this.toolEnv);
            this.setModalToolBefore();
        };
        Main.prototype.setModalToolBefore = function () {
            this.currentTool = this.modalBeforeTool;
            this.currentModalTool = null;
            this.modalBeforeTool = null;
        };
        Main.prototype.isModalToolRunning = function () {
            return (this.currentModalTool != null);
        };
        Main.prototype.openFileDialog = function () {
            this.openFileDialogModal();
        };
        // View operations
        Main.prototype.resizeWindows = function () {
            this.resizeCanvasToParent(this.mainWindow);
            this.fitCanvas(this.editorWindow, this.mainWindow);
            this.fitCanvas(this.webglWindow, this.mainWindow);
            this.fitCanvas(this.pickingWindow, this.mainWindow);
            this.resizeCanvasToParent(this.layerWindow);
            if (this.isWhileLoading()) {
                this.caluculateLayerWindowLayout(this.layerWindow);
            }
        };
        Main.prototype.resizeCanvasToParent = function (canvasWindow) {
            canvasWindow.width = canvasWindow.canvas.parentElement.clientWidth;
            canvasWindow.height = canvasWindow.canvas.parentElement.clientHeight;
            canvasWindow.canvas.width = canvasWindow.width;
            canvasWindow.canvas.height = canvasWindow.height;
        };
        Main.prototype.fitCanvas = function (canvasWindow, fitToWindow) {
            canvasWindow.width = fitToWindow.width;
            canvasWindow.height = fitToWindow.height;
            canvasWindow.canvas.width = canvasWindow.width;
            canvasWindow.canvas.height = canvasWindow.height;
        };
        Main.prototype.getMouseInfo = function (e, touchUp, canvasWindow) {
            this.toolMouseEvent.button = e.button;
            this.toolMouseEvent.buttons = e.buttons;
            if (touchUp) {
                this.toolMouseEvent.button = 0;
                this.toolMouseEvent.buttons = 0;
            }
            this.toolMouseEvent.offsetX = e.offsetX;
            this.toolMouseEvent.offsetY = e.offsetY;
            this.calculateTransfomredMouseParams(canvasWindow);
            //console.log(e.offsetX.toFixed(2) + ',' + e.offsetY.toFixed(2) + '  ' + this.toolMouseEvent.offsetX.toFixed(2) + ',' + this.toolMouseEvent.offsetY.toFixed(2));
        };
        Main.prototype.getTouchInfo = function (e, touchDown, touchUp, canvasWindow) {
            if (e.touches == undefined || e.touches.length == 0) {
                this.toolMouseEvent.button = 0;
                this.toolMouseEvent.buttons = 0;
                return;
            }
            var rect = canvasWindow.canvas.getBoundingClientRect();
            var touch = e.touches[0];
            if (!touchDown && touch.force < 0.1) {
                return;
            }
            if (touchDown) {
                this.toolMouseEvent.button = 1;
                this.toolMouseEvent.buttons = 1;
            }
            if (touchUp) {
                this.toolMouseEvent.button = 0;
                this.toolMouseEvent.buttons = 0;
            }
            this.toolMouseEvent.offsetX = touch.clientX - rect.left;
            this.toolMouseEvent.offsetY = touch.clientY - rect.top;
            this.calculateTransfomredMouseParams(canvasWindow);
            //console.log(touch.clientX.toFixed(2) + ',' + touch.clientY.toFixed(2) + '(' + ')'  + '  ' + this.toolMouseEvent.offsetX.toFixed(2) + ',' + this.toolMouseEvent.offsetY.toFixed(2));
        };
        Main.prototype.calculateTransfomredMouseParams = function (canvasWindow) {
            canvasWindow.caluclateViewMatrix(this.view2DMatrix);
            mat4.invert(this.invView2DMatrix, this.view2DMatrix);
            vec3.set(this.tempVec3, this.toolMouseEvent.offsetX, this.toolMouseEvent.offsetY, 0.0);
            vec3.transformMat4(this.toolMouseEvent.location, this.tempVec3, this.invView2DMatrix);
            vec3.copy(this.toolEnv.mouseCursorLocation, this.toolMouseEvent.location);
        };
        Main.prototype.hundleDoubleClick = function (wnd, offsetX, offsetY) {
            if (wnd.clickCount == 0) {
                wnd.clickCount++;
                wnd.clickedX = offsetX;
                wnd.clickedY = offsetY;
                setTimeout(function () {
                    wnd.clickCount = 0;
                }, 350);
                return false;
            }
            else {
                wnd.clickCount = 0;
                if (Math.pow(offsetX - wnd.clickedX, 2) + Math.pow(offsetY - wnd.clickedY, 2) < 9.0) {
                    return true;
                }
                else {
                    return false;
                }
            }
        };
        Main.prototype.getWheelInfo = function (e) {
            var wheelDelta = 0.0;
            if ('wheelDelta' in e) {
                wheelDelta = e['wheelDelta'];
            }
            else if ('deltaY' in e) {
                wheelDelta = e['deltaY'];
            }
            else if ('wheelDeltaY' in e) {
                wheelDelta = e['wheelDeltaY'];
            }
            if (wheelDelta > 0) {
                wheelDelta = 1.0;
            }
            else if (wheelDelta < 0) {
                wheelDelta = -1.0;
            }
            this.toolMouseEvent.wheelDelta = wheelDelta;
        };
        Main.prototype.createModalOptionObject = function (targetElementId) {
            return {
                content: {
                    target: targetElementId,
                    close: true,
                    speedIn: 0,
                    delay: 0,
                    speedOut: 100
                },
                overlay: this.modalOverlayOption,
                loader: this.modalLoaderOption
            };
        };
        Main.prototype.isModalShown = function () {
            return (this.currentModalDialogID != null && this.currentModalDialogID != this.ID.none);
        };
        Main.prototype.closeModal = function () {
            Custombox.modal.closeAll();
        };
        Main.prototype.openLayerPropertyModal = function (layer, layerWindowItem) {
            if (this.isModalShown()) {
                return;
            }
            // name
            this.setInputElementText(this.ID.layerPropertyModal_layerName, layer.name);
            // layer color
            this.setInputElementColor(this.ID.layerPropertyModal_layerColor, layer.layerColor);
            this.layerPropertyWindow_EditLayer = layer;
            this.currentModalDialogID = this.ID.layerPropertyModal;
            var modal = new Custombox.modal(this.createModalOptionObject(this.currentModalDialogID));
            modal.open();
        };
        Main.prototype.openOperationOptionModal = function () {
            if (this.isModalShown()) {
                return;
            }
            this.setRadioElementIntValue(this.ID.operationOptionModal_operationUnit, this.toolContext.operationUnitID);
            this.currentModalDialogID = this.ID.operationOptionModal;
            var modal = new Custombox.modal(this.createModalOptionObject(this.currentModalDialogID));
            modal.open();
        };
        Main.prototype.openNewLayerCommandOptionModal = function () {
            if (this.isModalShown()) {
                return;
            }
            var layerTypeID = this.getRadioElementIntValue(this.ID.operationOptionModal_operationUnit, ManualTracingTool.LayerTypeID.vectorLayer);
            this.currentModalDialogID = this.ID.newLayerCommandOptionModal;
            var modal = new Custombox.modal(this.createModalOptionObject(this.currentModalDialogID));
            modal.open();
        };
        Main.prototype.openFileDialogModal = function () {
            if (this.isModalShown()) {
                return;
            }
            this.currentModalDialogID = this.ID.openFileDialogModal;
            var modal = new Custombox.modal(this.createModalOptionObject(this.currentModalDialogID));
            modal.open();
        };
        Main.prototype.onModalWindowClosed = function () {
            if (this.currentModalDialogID == this.ID.layerPropertyModal) {
                var layer = this.layerPropertyWindow_EditLayer;
                // name
                var layerName = this.getInputElementText(this.ID.layerPropertyModal_layerName);
                if (!StringIsNullOrEmpty(layerName)) {
                    layer.name = layerName;
                }
                // layer color
                this.getInputElementColor(this.ID.layerPropertyModal_layerColor, this.layerPropertyWindow_LayerClolor);
                vec4.copy(layer.layerColor, this.layerPropertyWindow_LayerClolor);
                this.layerPropertyWindow_EditLayer = null;
            }
            else if (this.currentModalDialogID == this.ID.operationOptionModal) {
                this.toolContext.operationUnitID = this.getRadioElementIntValue(this.ID.operationOptionModal_operationUnit, ManualTracingTool.OperationUnitID.linePoint);
                this.setCurrentSelectionTool(this.toolContext.operationUnitID);
            }
            else if (this.currentModalDialogID == this.ID.newLayerCommandOptionModal) {
                if (this.currentModalDialogResult == this.ID.newLayerCommandOptionModal_ok) {
                    var layerType = this.getRadioElementIntValue(this.ID.newLayerCommandOptionModal_layerType, ManualTracingTool.LayerTypeID.vectorLayer);
                    // Select command
                    var layerCommand = null;
                    if (layerType == ManualTracingTool.LayerTypeID.vectorLayer) {
                        layerCommand = new ManualTracingTool.Command_Layer_AddVectorLayerToCurrentPosition();
                    }
                    else if (layerType == ManualTracingTool.LayerTypeID.groupLayer) {
                        layerCommand = new ManualTracingTool.Command_Layer_AddGroupLayerToCurrentPosition();
                    }
                    else if (layerType == ManualTracingTool.LayerTypeID.posingLayer) {
                        layerCommand = new ManualTracingTool.Command_Layer_AddPosingLayerToCurrentPosition();
                    }
                    else if (layerType == ManualTracingTool.LayerTypeID.imageFileReferenceLayer) {
                        layerCommand = new ManualTracingTool.Command_Layer_AddImageFileReferenceLayerToCurrentPosition();
                    }
                    if (layerCommand == null) {
                        return;
                    }
                    // Execute command
                    this.executeLayerCommand(layerCommand);
                }
            }
            else if (this.currentModalDialogID == this.ID.openFileDialogModal) {
                this.toolEnv.updateContext();
                if (this.currentModalDialogResult == this.ID.openFileDialogModal_ok) {
                    if (this.currentTool != null) {
                        var filePath = this.getInputElementFilePath(this.ID.openFileDialogModal_file);
                        if (!StringIsNullOrEmpty(filePath)) {
                            this.currentTool.onOpenFile(filePath, this.toolEnv);
                        }
                    }
                }
            }
            this.currentModalDialogID = this.ID.none;
            this.currentModalDialogResult = this.ID.none;
            this.toolEnv.setRedrawMainWindowEditorWindow();
            this.toolEnv.setRedrawLayerWindow();
        };
        // Drawings
        Main.prototype.draw = function () {
            this.toolEnv.updateContext();
            if (this.footerText != this.footerTextBefore) {
                this.getElement('footer').innerHTML = this.footerText;
                this.footerTextBefore = this.footerText;
            }
            if (this.toolContext.redrawMainWindow) {
                this.toolContext.redrawMainWindow = false;
                this.clearWindow(this.mainWindow);
                this.drawMainWindow(this.mainWindow);
            }
            if (this.toolContext.redrawEditorWindow) {
                this.toolContext.redrawEditorWindow = false;
                this.clearWindow(this.editorWindow);
                this.drawEditorWindow(this.editorWindow, this.mainWindow);
            }
            if (this.toolContext.updateLayerWindowItems) {
                this.toolContext.updateLayerWindowItems = false;
                this.collectLayerWindowItems();
                this.caluculateLayerWindowLayout(this.layerWindow);
            }
            if (this.toolContext.redrawLayerWindow) {
                this.toolContext.redrawLayerWindow = false;
                this.clearWindow(this.layerWindow);
                this.drawLayerWindow(this.layerWindow);
            }
            if (this.toolContext.redrawWebGLWindow) {
                this.toolContext.redrawWebGLWindow = false;
                this.drawWebGLWindow(this.mainWindow, this.webglWindow, this.pickingWindow);
            }
            if (this.toolContext.redrawHeaderWindow) {
                this.toolContext.redrawHeaderWindow = false;
                this.updateHeaderButtons();
            }
            if (this.toolContext.redrawFooterWindow) {
                this.toolContext.redrawFooterWindow = false;
                this.updateFooterMessage();
            }
        };
        Main.prototype.clearWindow = function (canvasWindow) {
            this.canvasRender.setContext(canvasWindow);
            this.canvasRender.clearRect(0, 0, canvasWindow.canvas.width, canvasWindow.canvas.height);
        };
        Main.prototype.drawMainWindow = function (canvasWindow) {
            this.canvasRender.setContext(canvasWindow);
            for (var i = this.document.rootLayer.childLayers.length - 1; i >= 0; i--) {
                var layer = this.document.rootLayer.childLayers[i];
                this.drawLayerRecursive(layer);
            }
        };
        Main.prototype.drawLayerRecursive = function (layer) {
            if (!layer.isVisible) {
                return;
            }
            if (layer.type == ManualTracingTool.LayerTypeID.vectorLayer) {
                var vectorLayer = layer;
                this.drawVectorLayer(vectorLayer);
            }
            else if (layer.type == ManualTracingTool.LayerTypeID.groupLayer) {
                for (var i = layer.childLayers.length - 1; i >= 0; i--) {
                    var childLayer = layer.childLayers[i];
                    this.drawLayerRecursive(childLayer);
                }
            }
            else if (layer.type == ManualTracingTool.LayerTypeID.posingLayer) {
                // No drawing
            }
            else if (layer.type == ManualTracingTool.LayerTypeID.imageFileReferenceLayer) {
                var ifrLayer = layer;
                this.drawImageFileReferenceLayer(ifrLayer);
            }
        };
        Main.prototype.drawVectorLayer = function (layer) {
            var context = this.toolContext;
            var isCurrentLayer = (layer == context.currentVectorLayer);
            vec4.copy(this.editOtherLayerLineColor, layer.layerColor);
            this.editOtherLayerLineColor[3] *= 0.3;
            var useAdjustingLocation = this.isModalToolRunning();
            for (var _i = 0, _a = layer.groups; _i < _a.length; _i++) {
                var group = _a[_i];
                for (var _b = 0, _c = group.lines; _b < _c.length; _b++) {
                    var line = _c[_b];
                    if (line.points.length == 0) {
                        continue;
                    }
                    if (this.toolEnv.isDrawMode()) {
                        this.drawVectorLineStroke(line, layer.layerColor, line.strokeWidth, useAdjustingLocation);
                    }
                    else if (this.toolEnv.isSelectMode()) {
                        if (!isCurrentLayer) {
                            this.drawVectorLineStroke(line, this.editOtherLayerLineColor, line.strokeWidth, useAdjustingLocation);
                        }
                        else {
                            if (this.toolContext.operationUnitID == ManualTracingTool.OperationUnitID.linePoint) {
                                this.drawVectorLineStroke(line, layer.layerColor, line.strokeWidth, useAdjustingLocation);
                                this.drawVectorLinePoints(line, layer.layerColor, useAdjustingLocation);
                            }
                            else if (this.toolContext.operationUnitID == ManualTracingTool.OperationUnitID.lineSegment) {
                                this.drawVectorLineStroke(line, layer.layerColor, line.strokeWidth, useAdjustingLocation);
                                this.drawVectorLinePoints(line, layer.layerColor, useAdjustingLocation);
                            }
                            else if (this.toolContext.operationUnitID == ManualTracingTool.OperationUnitID.line) {
                                var color = layer.layerColor;
                                if (line.isSelected) {
                                    color = this.drawStyle.selectedVectorLineColor;
                                }
                                if (line.isCloseToMouse) {
                                    this.drawVectorLineStroke(line, color, line.strokeWidth + 2.0, useAdjustingLocation);
                                }
                                else {
                                    this.drawVectorLineStroke(line, color, line.strokeWidth, useAdjustingLocation);
                                }
                                //this.drawAdjustingLinePoints(canvasWindow, line);
                            }
                        }
                    }
                }
            }
        };
        Main.prototype.drawVectorLineStroke = function (line, color, strokeWidth, useAdjustingLocation) {
            if (line.points.length == 0) {
                return;
            }
            this.canvasRender.setStrokeWidth(strokeWidth);
            this.canvasRender.setStrokeColorV(color);
            this.drawVectorLineSegment(line, 0, line.points.length - 1, useAdjustingLocation);
        };
        Main.prototype.drawVectorLinePoints = function (line, color, useAdjustingLocation) {
            this.canvasRender.setStrokeWidth(this.getCurrentViewScaleLineWidth(1.0));
            // make color darker or lighter than original to visible on line color
            ManualTracingTool.ColorLogic.rgbToHSV(this.tempEditorLinePointColor1, color);
            if (this.tempEditorLinePointColor1[2] > 0.5) {
                this.tempEditorLinePointColor1[2] -= this.drawStyle.linePointVisualBrightnessAdjustRate;
            }
            else {
                this.tempEditorLinePointColor1[2] += this.drawStyle.linePointVisualBrightnessAdjustRate;
            }
            ManualTracingTool.ColorLogic.hsvToRGB(this.tempEditorLinePointColor2, this.tempEditorLinePointColor1);
            for (var _i = 0, _a = line.points; _i < _a.length; _i++) {
                var point = _a[_i];
                this.drawVectorLinePoint(point, this.tempEditorLinePointColor2, useAdjustingLocation);
            }
        };
        Main.prototype.lineWidthAdjust = function (width) {
            return Math.floor(width * 5) / 5;
        };
        Main.prototype.drawVectorLineSegment = function (line, startIndex, endIndex, useAdjustingLocation) {
            this.canvasRender.setLineCap(ManualTracingTool.CanvasRenderLineCap.round);
            this.canvasRender.beginPath();
            var firstPoint = line.points[startIndex];
            if (useAdjustingLocation) {
                this.canvasRender.moveTo(firstPoint.adjustingLocation[0], firstPoint.adjustingLocation[1]);
            }
            else {
                this.canvasRender.moveTo(firstPoint.location[0], firstPoint.location[1]);
            }
            var currentLineWidth = this.lineWidthAdjust(firstPoint.lineWidth);
            this.canvasRender.setStrokeWidth(currentLineWidth);
            for (var i = startIndex + 1; i <= endIndex; i++) {
                var point1 = line.points[i];
                if (useAdjustingLocation) {
                    this.canvasRender.lineTo(point1.adjustingLocation[0], point1.adjustingLocation[1]);
                }
                else {
                    this.canvasRender.lineTo(point1.location[0], point1.location[1]);
                }
                if (point1.lineWidth != currentLineWidth) {
                    this.canvasRender.stroke();
                    this.canvasRender.beginPath();
                    currentLineWidth = this.lineWidthAdjust(point1.lineWidth);
                    this.canvasRender.setStrokeWidth(currentLineWidth);
                    if (useAdjustingLocation) {
                        this.canvasRender.moveTo(point1.adjustingLocation[0], point1.adjustingLocation[1]);
                    }
                    else {
                        this.canvasRender.moveTo(point1.location[0], point1.location[1]);
                    }
                    continue;
                }
            }
            this.canvasRender.stroke();
        };
        Main.prototype.drawVectorLinePoint = function (point, color, useAdjustingLocation) {
            var viewScale = this.canvasRender.getViewScale();
            this.canvasRender.beginPath();
            var radius = this.drawStyle.generalLinePointRadius / viewScale;
            if (point.isSelected) {
                radius = this.drawStyle.selectedLinePointRadius / viewScale;
                this.canvasRender.setStrokeColorV(this.drawStyle.selectedVectorLineColor);
                this.canvasRender.setFillColorV(this.drawStyle.selectedVectorLineColor);
            }
            else {
                this.canvasRender.setStrokeColorV(color);
                this.canvasRender.setFillColorV(color);
            }
            if (useAdjustingLocation) {
                this.canvasRender.circle(point.adjustingLocation[0], point.adjustingLocation[1], radius);
            }
            else {
                this.canvasRender.circle(point.location[0], point.location[1], radius);
            }
            this.canvasRender.fill();
        };
        Main.prototype.drawEditLineStroke = function (line) {
            this.drawVectorLineStroke(line, this.drawStyle.editingLineColor, this.getCurrentViewScaleLineWidth(3.0), false);
        };
        Main.prototype.drawEditLinePoints = function (canvasWindow, line, color) {
            this.canvasRender.setStrokeWidth(this.getCurrentViewScaleLineWidth(1.0));
            this.canvasRender.setStrokeColorV(color);
            this.canvasRender.setFillColorV(color);
            for (var _i = 0, _a = line.points; _i < _a.length; _i++) {
                var point = _a[_i];
                this.drawVectorLinePoint(point, color, false);
            }
        };
        Main.prototype.getCurrentViewScaleLineWidth = function (width) {
            return width / this.canvasRender.getViewScale();
        };
        Main.prototype.getViewScaledSize = function (width) {
            return width / this.canvasRender.getViewScale();
        };
        Main.prototype.drawImageFileReferenceLayer = function (layer) {
            if (layer.imageResource == null
                || layer.imageResource.image == null
                || layer.imageResource.image.imageData == null) {
                return;
            }
            var image = layer.imageResource.image.imageData;
            var isModal = this.isModalToolRunning();
            var location = (isModal ? layer.adjustingLocation : layer.location);
            var rotation = (isModal ? layer.adjustingRotation[0] : layer.rotation[0]);
            var scale = (isModal ? layer.adjustingScale : layer.scale);
            mat4.identity(this.tempMat4);
            mat4.translate(this.tempMat4, this.tempMat4, location);
            mat4.rotateZ(this.tempMat4, this.tempMat4, rotation);
            mat4.scale(this.tempMat4, this.tempMat4, scale);
            this.canvasRender.setLocalTransForm(this.tempMat4);
            this.canvasRender.drawImage(image, 0.0, 0.0, image.width, image.height, 0.0, 0.0, image.width, image.height);
            this.canvasRender.cancelLocalTransForm();
        };
        // Editor window drawing
        Main.prototype.drawEditorWindow = function (editorWindow, mainWindow) {
            var context = this.toolContext;
            mainWindow.updateViewMatrix();
            mainWindow.copyTransformTo(editorWindow);
            this.canvasRender.setContext(editorWindow);
            if (this.toolEnv.needsDrawOperatorCursor()) {
                this.drawOperatorCursor();
            }
            if (this.toolEnv.isSelectMode()) {
                this.drawMouseCursor();
            }
            if (this.toolEnv.isDrawMode()) {
                if (this.currentTool == this.tool_DrawLine) {
                    if (this.tool_DrawLine.editLine != null) {
                        this.drawEditLineStroke(this.tool_DrawLine.editLine);
                    }
                }
                else if (context.mainToolID == ManualTracingTool.MainToolID.posing) {
                    //for (let subtool of this.mainTools[<int>MainToolID.posing].subTools) {
                    //    let posingTools = <Tool_Posing3d_ToolBase>subtool;
                    //    if (posingTools.editLine != null) {
                    //        this.drawRawLine(editorWindow, posingTools.editLine);
                    //    }
                    //}
                    if (this.currentTool == this.tool_Posing3d_LocateHead
                        && this.tool_Posing3d_LocateHead.editLine != null) {
                        this.drawEditLineStroke(this.tool_Posing3d_LocateHead.editLine);
                    }
                }
            }
            if (this.currentTool != null) {
                this.toolEnv.updateContext();
                this.toolDrawEnv.setVariables(editorWindow);
                this.currentTool.onDrawEditor(this.toolEnv, this.toolDrawEnv);
            }
        };
        Main.prototype.drawOperatorCursor = function () {
            this.canvasRender.beginPath();
            this.canvasRender.setStrokeColorV(this.drawStyle.operatorCursorCircleColor);
            this.canvasRender.setStrokeWidth(this.getCurrentViewScaleLineWidth(1.0));
            var viewScale = this.getViewScaledSize(1.0);
            this.operatorCurosrLineDashScaled[0] = this.operatorCurosrLineDash[0] * viewScale;
            this.operatorCurosrLineDashScaled[1] = this.operatorCurosrLineDash[1] * viewScale;
            this.canvasRender.setLineDash(this.operatorCurosrLineDashScaled);
            this.canvasRender.circle(this.toolContext.operatorCursor.location[0], this.toolContext.operatorCursor.location[1], this.toolContext.operatorCursor.radius * viewScale);
            this.canvasRender.stroke();
            var centerX = this.toolContext.operatorCursor.location[0];
            var centerY = this.toolContext.operatorCursor.location[1];
            var clossBeginPosition = this.toolContext.operatorCursor.radius * viewScale * 1.5;
            var clossEndPosition = this.toolContext.operatorCursor.radius * viewScale * 0.5;
            this.canvasRender.drawLine(centerX - clossBeginPosition, centerY, centerX - clossEndPosition, centerY);
            this.canvasRender.drawLine(centerX + clossBeginPosition, centerY, centerX + clossEndPosition, centerY);
            this.canvasRender.drawLine(centerX, centerY - clossBeginPosition, centerX, centerY - clossEndPosition);
            this.canvasRender.drawLine(centerX, centerY + clossBeginPosition, centerX, centerY + clossEndPosition);
            this.canvasRender.setLineDash(this.operatorCurosrLineDashNone);
        };
        // MainEditorDrawer implementations
        Main.prototype.drawMouseCursor = function () {
            this.canvasRender.beginPath();
            this.canvasRender.setStrokeColorV(this.drawStyle.mouseCursorCircleColor);
            this.canvasRender.setStrokeWidth(this.getCurrentViewScaleLineWidth(1.0));
            this.canvasRender.circle(this.toolMouseEvent.location[0], this.toolMouseEvent.location[1], this.getCurrentViewScaleLineWidth(this.toolContext.mouseCursorRadius));
            this.canvasRender.stroke();
        };
        Main.prototype.drawEditorEditLineStroke = function (line) {
            this.drawEditLineStroke(line);
        };
        Main.prototype.drawEditorVectorLineStroke = function (line, color, strokeWidth, useAdjustingLocation) {
            this.drawVectorLineStroke(line, color, strokeWidth, useAdjustingLocation);
        };
        Main.prototype.drawEditorVectorLinePoints = function (line, color, useAdjustingLocation) {
            this.drawVectorLinePoints(line, color, useAdjustingLocation);
        };
        Main.prototype.drawEditorVectorLineSegment = function (line, startIndex, endIndex, useAdjustingLocation) {
            this.drawVectorLineSegment(line, startIndex, endIndex, useAdjustingLocation);
        };
        // WebGL window drawing
        Main.prototype.drawWebGLWindow = function (mainWindow, webglWindow, pickingWindow) {
            if (this.toolContext.currentPosingData == null) {
                return;
            }
            mainWindow.copyTransformTo(pickingWindow);
            this.webGLRender.setViewport(0.0, 0.0, webglWindow.width, webglWindow.height);
            this.posing3dView.drawPickingImage(this.toolEnv);
            pickingWindow.context.clearRect(0, 0, pickingWindow.width, pickingWindow.height);
            pickingWindow.context.drawImage(webglWindow.canvas, 0, 0, webglWindow.width, webglWindow.height);
            this.posing3dView.drawVisualImage(this.toolEnv);
        };
        Main.prototype.collectLayerWindowButtons = function () {
            this.layerWindowButtons = new List();
            this.layerWindowButtons.push((new LayerWindowButton()).ID(LayerWindowButtonID.addLayer));
            this.layerWindowButtons.push((new LayerWindowButton()).ID(LayerWindowButtonID.deleteLayer));
            this.layerWindowButtons.push((new LayerWindowButton()).ID(LayerWindowButtonID.moveUp));
            this.layerWindowButtons.push((new LayerWindowButton()).ID(LayerWindowButtonID.moveDown));
        };
        Main.prototype.collectLayerWindowItems = function () {
            this.layerWindowItems = new List();
            this.collectLayerWindowItemsRecursive(this.layerWindowItems, this.document.rootLayer, 0);
            var previousItem = null;
            for (var _i = 0, _a = this.layerWindowItems; _i < _a.length; _i++) {
                var item = _a[_i];
                item.previousItem = previousItem;
                if (previousItem != null) {
                    previousItem.nextItem = item;
                }
                previousItem = item;
            }
        };
        Main.prototype.collectLayerWindowItemsRecursive = function (result, parentLayer, currentDepth) {
            var siblingItem = null;
            for (var _i = 0, _a = parentLayer.childLayers; _i < _a.length; _i++) {
                var layer = _a[_i];
                var item = new LayerWindowItem();
                item.layer = layer;
                item.parentLayer = parentLayer;
                item.hierarchyDepth = currentDepth;
                item.previousSiblingItem = siblingItem;
                if (siblingItem != null) {
                    siblingItem.nextSiblingItem = item;
                }
                result.push(item);
                if (layer.childLayers.length > 0) {
                    this.collectLayerWindowItemsRecursive(this.layerWindowItems, layer, currentDepth + 1);
                }
                siblingItem = item;
            }
        };
        Main.prototype.findCurrentLayerLayerWindowItem = function () {
            for (var _i = 0, _a = this.layerWindowItems; _i < _a.length; _i++) {
                var item = _a[_i];
                if (item.layer == this.toolContext.currentLayer) {
                    return item;
                }
            }
            return null;
        };
        Main.prototype.caluculateLayerWindowLayout = function (layerWindow) {
            layerWindow.layerWindowPainY = layerWindow.height * layerWindow.layerWindowPainRate;
            // layer item buttons
            this.layerWindowLayoutArea.copyRectangle(layerWindow);
            this.layerWindowLayoutArea.bottom = layerWindow.layerWindowPainY - 1.0;
            this.caluculateLayerWindowLayout_LayerButtons(layerWindow, this.layerWindowLayoutArea);
            if (this.layerWindowButtons.length > 0) {
                var lastButton = this.layerWindowButtons[this.layerWindowButtons.length - 1];
                layerWindow.layerItemButtonButtom = lastButton.bottom;
                this.layerWindowLayoutArea.top = lastButton.bottom + 1.0;
            }
            // layer items
            this.caluculateLayerWindowLayout_LayerWindowItem(layerWindow, this.layerWindowLayoutArea);
            // subtools
            this.layerWindowLayoutArea.top = layerWindow.layerWindowPainY;
            this.caluculateLayerWindowLayout_SubToolViewItem(layerWindow, this.layerWindowLayoutArea);
        };
        Main.prototype.caluculateLayerWindowLayout_LayerButtons = function (layerWindow, layoutArea) {
            var currentX = layoutArea.left;
            var currentY = layoutArea.top;
            var unitWidth = layerWindow.layerItemButtonWidth * layerWindow.layerItemButtonScale;
            var unitHeight = layerWindow.layerItemButtonHeight * layerWindow.layerItemButtonScale;
            for (var _i = 0, _a = this.layerWindowButtons; _i < _a.length; _i++) {
                var button = _a[_i];
                button.left = currentX;
                button.right = currentX + unitWidth - 1;
                button.top = currentY;
                button.bottom = currentY + unitHeight - 1;
                currentX += unitWidth;
            }
        };
        Main.prototype.caluculateLayerWindowLayout_LayerWindowItem = function (layerWindow, layoutArea) {
            var currentY = layoutArea.top;
            var itemHeight = layerWindow.layerItemHeight;
            var margine = itemHeight * 0.1;
            var iconWidth = (itemHeight - margine * 2);
            var textLeftMargin = itemHeight * 0.3;
            for (var _i = 0, _a = this.layerWindowItems; _i < _a.length; _i++) {
                var item = _a[_i];
                item.left = 0.0;
                item.top = currentY;
                item.right = layerWindow.width - 1;
                item.bottom = currentY + itemHeight - 1;
                item.marginLeft = margine;
                item.marginTop = margine;
                item.marginRight = margine;
                item.marginBottom = margine;
                item.visibilityIconWidth = iconWidth;
                item.textLeft = item.left + margine + iconWidth + textLeftMargin;
                currentY += itemHeight;
            }
        };
        Main.prototype.drawLayerWindow = function (layerWindow) {
            this.canvasRender.setContext(layerWindow);
            this.drawLayerWindow_LayerWindowButtons(layerWindow);
            this.drawLayerWindow_LayerItems(layerWindow);
            this.drawLayerWindow_SubTools(layerWindow);
        };
        Main.prototype.drawLayerWindow_LayerWindowButtons = function (layerWindow) {
            for (var _i = 0, _a = this.layerWindowButtons; _i < _a.length; _i++) {
                var button = _a[_i];
                this.drawLayerWindow_LayerWindowButton(button);
            }
        };
        Main.prototype.drawLayerWindow_LayerWindowButton = function (button) {
            var srcWidth = 64.0;
            var srcHeight = 64.0;
            var srcX = 0.0;
            var srcY = (button.buttonID - 1) * srcHeight;
            var dstX = button.left;
            var dstY = button.top;
            var scale = 1.0;
            var dstWidth = button.getWidth() * scale;
            var dstHeight = button.getHeight() * scale;
            var srcImage = this.layerButtonImage;
            this.canvasRender.drawImage(srcImage.image.imageData, srcX, srcY, srcWidth, srcHeight, dstX, dstY, dstWidth, dstHeight);
        };
        Main.prototype.drawLayerWindow_LayerItems = function (layerWindow) {
            for (var _i = 0, _a = this.layerWindowItems; _i < _a.length; _i++) {
                var item = _a[_i];
                this.drawLayerWindowItem(item, layerWindow.layerItemFontSize);
            }
        };
        Main.prototype.drawLayerWindowItem = function (item, fontSize) {
            var layer = item.layer;
            var left = item.left;
            var top = item.top;
            var bottom = item.bottom;
            var itemWidth = item.getWidth();
            var itemHeight = item.getHeight();
            var bottomMargin = itemHeight * 0.3;
            var depthOffset = 10.0 * item.hierarchyDepth;
            if (layer.isSelected) {
                this.canvasRender.setFillColorV(this.layerWindowItemSelectedColor);
            }
            else {
                this.canvasRender.setFillColorV(this.layerWindowBackgroundColor);
            }
            this.canvasRender.fillRect(left, top, itemWidth, itemHeight);
            // Visible/Unvisible icon
            var srcImage = this.systemImage.image;
            var iconIndex = (item.layer.isVisible ? 0.0 : 1.0);
            var srcWidth = srcImage.width * 0.125;
            var srcHeight = srcImage.height * 0.125;
            var srcX = srcWidth * iconIndex;
            var srcY = srcImage.height * 0.25;
            var dstX = item.marginLeft;
            var dstY = top + item.marginTop;
            var dstWidth = item.visibilityIconWidth;
            var dstHeigh = item.visibilityIconWidth;
            this.canvasRender.drawImage(this.systemImage.image.imageData, srcX, srcY, srcWidth, srcHeight, dstX, dstY, dstWidth, dstHeigh);
            // Text
            this.canvasRender.setFontSize(fontSize);
            this.canvasRender.setFillColor(0.0, 0.0, 0.0, 1.0);
            this.canvasRender.fillText(layer.name, item.textLeft + depthOffset, bottom - bottomMargin);
        };
        Main.prototype.collectSubToolViewItems = function () {
            this.subToolViewItems = new List();
            var currentMainTool = this.getCurrentMainTool();
            for (var i = 0; i < currentMainTool.subTools.length; i++) {
                var tool = currentMainTool.subTools[i];
                var viewItem = new SubToolViewItem();
                viewItem.toolIndex = i;
                viewItem.tool = tool;
                for (var buttonIndex = 0; buttonIndex < tool.inputSideOptionCount; buttonIndex++) {
                    var button = new SubToolViewItemOptionButton();
                    button.index = buttonIndex;
                    viewItem.buttons.push(button);
                }
                this.subToolViewItems.push(viewItem);
            }
        };
        Main.prototype.caluculateLayerWindowLayout_SubToolViewItem = function (layerWindow, layoutArea) {
            var scale = layerWindow.subToolItemScale;
            var fullWidth = layerWindow.width - 1;
            var unitHeight = layerWindow.subToolItemUnitHeight * scale - 1;
            var currentY = layoutArea.top;
            for (var _i = 0, _a = this.subToolViewItems; _i < _a.length; _i++) {
                var viewItem = _a[_i];
                viewItem.left = 0.0;
                viewItem.top = currentY;
                viewItem.right = fullWidth;
                viewItem.bottom = currentY + unitHeight - 1;
                currentY += unitHeight;
            }
        };
        Main.prototype.drawLayerWindow_SubTools = function (layerWindow) {
            var context = this.toolContext;
            var currentMainTool = this.getCurrentMainTool();
            var srcImage = currentMainTool.subToolImage;
            if (srcImage == null) {
                return;
            }
            var scale = layerWindow.subToolItemScale;
            var fullWidth = layerWindow.width - 1;
            var unitWidth = layerWindow.subToolItemUnitWidth;
            var unitHeight = layerWindow.subToolItemUnitHeight;
            var lastY = 0.0;
            for (var _i = 0, _a = this.subToolViewItems; _i < _a.length; _i++) {
                var viewItem = _a[_i];
                var tool = viewItem.tool;
                var srcY = viewItem.toolIndex * unitHeight;
                var dstY = viewItem.top;
                // Draw subtool image
                if (tool == this.currentTool) {
                    this.canvasRender.setFillColorV(this.subToolItemSelectedColor);
                }
                else {
                    this.canvasRender.setFillColorV(this.layerWindowBackgroundColor);
                }
                this.canvasRender.fillRect(0, dstY, fullWidth, unitHeight * scale);
                if (tool.isAvailable(this.toolEnv)) {
                    this.canvasRender.setGlobalAlpha(1.0);
                }
                else {
                    this.canvasRender.setGlobalAlpha(0.5);
                }
                this.canvasRender.drawImage(srcImage.image.imageData, 0, srcY, unitWidth, unitHeight, 0, dstY, unitWidth * scale, unitHeight * scale);
                // Draw subtool option buttons
                for (var _b = 0, _c = viewItem.buttons; _b < _c.length; _b++) {
                    var button = _c[_b];
                    var buttonWidth = 128 * scale;
                    var buttonHeight = 128 * scale;
                    button.left = unitWidth * scale * 0.8;
                    button.top = dstY;
                    button.right = button.left + buttonWidth - 1;
                    button.bottom = button.top + buttonHeight - 1;
                    var inpuSideID = tool.getInputSideID(button.index, this.toolEnv);
                    if (inpuSideID == ManualTracingTool.InputSideID.front) {
                        this.canvasRender.drawImage(this.systemImage.image.imageData, 0, 0, 128, 128, button.left, button.top, buttonWidth, buttonHeight);
                    }
                    else if (inpuSideID == ManualTracingTool.InputSideID.back) {
                        this.canvasRender.drawImage(this.systemImage.image.imageData, 128, 0, 128, 128, button.left, button.top, buttonWidth, buttonHeight);
                    }
                }
                this.canvasRender.setStrokeWidth(0.0);
                this.canvasRender.setStrokeColorV(this.subToolItemSeperatorLineColor);
                this.canvasRender.drawLine(0, dstY, fullWidth, dstY);
                lastY = dstY + unitHeight * scale;
            }
            this.canvasRender.setGlobalAlpha(1.0);
            this.canvasRender.drawLine(0, lastY, fullWidth, lastY);
        };
        // Header window drawing
        Main.prototype.updateHeaderButtons = function () {
            this.setHeaderButtonVisual(this.ID.menu_btnDrawTool, this.toolContext.mainToolID == ManualTracingTool.MainToolID.drawLine);
            this.setHeaderButtonVisual(this.ID.menu_btnScratchTool, this.toolContext.mainToolID == ManualTracingTool.MainToolID.scratchLine);
            this.setHeaderButtonVisual(this.ID.menu_btnPoseTool, this.toolContext.mainToolID == ManualTracingTool.MainToolID.posing);
        };
        Main.prototype.setHeaderButtonVisual = function (elementID, isSelected) {
            var element = this.getElement(elementID);
            if (isSelected) {
                element.classList.remove(this.ID.unselectedMainButton);
                element.classList.add(this.ID.selectedMainButton);
            }
            else {
                element.classList.remove(this.ID.selectedMainButton);
                element.classList.add(this.ID.unselectedMainButton);
            }
        };
        Main.prototype.updateFooterMessage = function () {
            var context = this.toolContext;
            var modeText = '';
            if (this.toolEnv.isDrawMode()) {
                modeText = 'DrawMode';
            }
            else if (this.toolEnv.isSelectMode()) {
                modeText = 'SelectMode';
            }
            var toolText = '';
            if (this.toolEnv.isDrawMode()) {
                if (this.currentTool == this.tool_DrawLine) {
                    toolText = 'Draw line';
                }
                else if (this.currentTool == this.tool_ScratchLine) {
                    toolText = 'Scratch line';
                }
                else if (this.currentTool == this.tool_Posing3d_LocateHead) {
                    toolText = 'Posing(Head location)';
                }
            }
            else if (this.toolEnv.isSelectMode()) {
                toolText = '';
            }
            this.footerText = modeText + ' ' + toolText;
            this.footerText = this.currentTool.helpText;
        };
        // UI management
        Main.prototype.hitTestLayout = function (areas, x, y) {
            for (var _i = 0, areas_1 = areas; _i < areas_1.length; _i++) {
                var area = areas_1[_i];
                if (x >= area.left
                    && x <= area.right
                    && y >= area.top
                    && y <= area.bottom) {
                    return area;
                }
            }
            return null;
        };
        // Selection management
        Main.prototype.mousemoveHittest = function (x, y, minDistance, recursive) {
            this.hittest_Line_IsCloseTo.startProcess();
            if (recursive) {
                this.hittest_Line_IsCloseTo.processLayerRecursive(this.document.rootLayer.childLayers, x, y, minDistance);
            }
            else {
                if (this.toolEnv.currentVectorLayer != null) {
                    this.hittest_Line_IsCloseTo.processLayer(this.toolEnv.currentVectorLayer, x, y, minDistance);
                }
            }
            this.hittest_Line_IsCloseTo.endProcess();
            return this.hittest_Line_IsCloseTo.isChanged;
        };
        // HTML helper
        Main.prototype.getElement = function (id) {
            return document.getElementById(id);
        };
        Main.prototype.setInputElementText = function (id, text) {
            var element = (document.getElementById(id));
            element.value = text;
            return element;
        };
        Main.prototype.setRadioElementIntValue = function (elementName, value) {
            var valueText = value.toString();
            var elements = document.getElementsByName(elementName);
            for (var i = 0; i < elements.length; i++) {
                var radio = elements[i];
                radio.checked = (radio.value == valueText);
            }
        };
        Main.prototype.getRadioElementIntValue = function (elementName, defaultValue) {
            var value = defaultValue;
            var elements = document.getElementsByName(elementName);
            for (var i = 0; i < elements.length; i++) {
                var radio = elements[i];
                if (radio.checked) {
                    value = (Number(radio.value));
                }
            }
            return value;
        };
        Main.prototype.getInputElementText = function (id) {
            var element = (document.getElementById(id));
            return element.value;
        };
        Main.prototype.setInputElementColor = function (id, color) {
            var colorText = '#' + ManualTracingTool.ColorLogic.rgbToHex2String(color);
            var element = (document.getElementById(id));
            element.value = colorText;
            return color;
        };
        Main.prototype.getInputElementColor = function (id, result) {
            var element = (document.getElementById(id));
            var colorText = element.value;
            ManualTracingTool.ColorLogic.hex2StringToRGB(result, colorText);
            return result;
        };
        Main.prototype.getInputElementFilePath = function (id) {
            var element = (document.getElementById(id));
            if (element.files.length == 0) {
                return null;
            }
            var file = element.files[0];
            return file.path;
        };
        return Main;
    }());
    var LayerWindow = /** @class */ (function (_super) {
        __extends(LayerWindow, _super);
        function LayerWindow() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.clickCount = 0;
            _this.clickedX = 0;
            _this.clickedY = 0;
            _this.layerWindowPainRate = 0.5;
            _this.layerWindowPainY = 0.0;
            _this.layerItemButtonScale = 0.375;
            _this.layerItemButtonWidth = 64.0;
            _this.layerItemButtonHeight = 64.0;
            _this.layerItemButtonButtom = 64.0;
            _this.layerItemHeight = 24.0;
            _this.layerItemFontSize = 16.0;
            _this.layerItemVisibilityIconWidth = 24.0;
            _this.layerItemVisibilityIconRight = 24.0;
            _this.subToolItemScale = 0.5;
            _this.subToolItemUnitWidth = 256;
            _this.subToolItemUnitHeight = 128;
            return _this;
        }
        return LayerWindow;
    }(ManualTracingTool.CanvasWindow));
    var RectangleLayoutArea = /** @class */ (function () {
        function RectangleLayoutArea() {
            this.index = -1;
            this.marginTop = 0.0;
            this.marginRight = 0.0;
            this.marginBottom = 0.0;
            this.marginLeft = 0.0;
            this.top = 0.0;
            this.right = 0.0;
            this.bottom = 0.0;
            this.left = 0.0;
            this.borderTop = 0.0;
            this.borderRight = 0.0;
            this.borderBottom = 0.0;
            this.borderLeft = 0.0;
            this.paddingTop = 0.0;
            this.paddingRight = 0.0;
            this.paddingBottom = 0.0;
            this.paddingLeft = 0.0;
        }
        RectangleLayoutArea.prototype.getWidth = function () {
            return (this.right - this.left + 1.0);
        };
        RectangleLayoutArea.prototype.getHeight = function () {
            return (this.bottom - this.top + 1.0);
        };
        RectangleLayoutArea.prototype.copyRectangle = function (canvasWindow) {
            this.left = 0.0;
            this.top = 0.0;
            this.right = canvasWindow.width - 1.0;
            this.bottom = canvasWindow.width - 1.0;
        };
        return RectangleLayoutArea;
    }());
    var LayerWindowButtonID;
    (function (LayerWindowButtonID) {
        LayerWindowButtonID[LayerWindowButtonID["none"] = 0] = "none";
        LayerWindowButtonID[LayerWindowButtonID["addLayer"] = 1] = "addLayer";
        LayerWindowButtonID[LayerWindowButtonID["deleteLayer"] = 2] = "deleteLayer";
        LayerWindowButtonID[LayerWindowButtonID["moveUp"] = 3] = "moveUp";
        LayerWindowButtonID[LayerWindowButtonID["moveDown"] = 4] = "moveDown";
    })(LayerWindowButtonID || (LayerWindowButtonID = {}));
    var LayerWindowButton = /** @class */ (function (_super) {
        __extends(LayerWindowButton, _super);
        function LayerWindowButton() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        LayerWindowButton.prototype.ID = function (id) {
            this.buttonID = id;
            return this;
        };
        return LayerWindowButton;
    }(RectangleLayoutArea));
    var LayerWindowItem = /** @class */ (function (_super) {
        __extends(LayerWindowItem, _super);
        function LayerWindowItem() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.layer = null;
            _this.parentLayer = null;
            _this.previousItem = null;
            _this.nextItem = null;
            _this.previousSiblingItem = null;
            _this.nextSiblingItem = null;
            _this.hierarchyDepth = 0;
            _this.margine = 0.0;
            _this.visibilityIconWidth = 0.0;
            _this.textLeft = 0.0;
            return _this;
        }
        return LayerWindowItem;
    }(RectangleLayoutArea));
    var SubToolViewItem = /** @class */ (function (_super) {
        __extends(SubToolViewItem, _super);
        function SubToolViewItem() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.toolIndex = 0;
            _this.tool = null;
            _this.buttons = new List();
            return _this;
        }
        return SubToolViewItem;
    }(RectangleLayoutArea));
    var SubToolViewItemOptionButton = /** @class */ (function (_super) {
        __extends(SubToolViewItemOptionButton, _super);
        function SubToolViewItemOptionButton() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return SubToolViewItemOptionButton;
    }(RectangleLayoutArea));
    var HTMLElementID = /** @class */ (function () {
        function HTMLElementID() {
            this.menu_btnDrawTool = 'menu_btnDrawTool';
            this.menu_btnScratchTool = 'menu_btnScratchTool';
            this.menu_btnPoseTool = 'menu_btnPoseTool';
            this.menu_btnOperationOption = 'menu_btnOperationOption';
            this.unselectedMainButton = 'unselectedMainButton';
            this.selectedMainButton = 'selectedMainButton';
            this.none = 'none';
            this.openFileDialogModal = '#openFileDialogModal';
            this.openFileDialogModal_file = 'openFileDialogModal.file';
            this.openFileDialogModal_ok = 'openFileDialogModal.ok';
            this.openFileDialogModal_cancel = 'openFileDialogModal.cancel';
            this.layerPropertyModal = '#layerPropertyModal';
            this.layerPropertyModal_layerName = 'layerPropertyModal.layerName';
            this.layerPropertyModal_layerColor = 'layerPropertyModal.layerColor';
            this.operationOptionModal = '#operationOptionModal';
            this.operationOptionModal_operationUnit = 'operationOptionModal.operationUnit';
            this.newLayerCommandOptionModal = '#newLayerCommandOptionModal';
            this.newLayerCommandOptionModal_layerType = 'newLayerCommandOptionModal.layerType';
            this.newLayerCommandOptionModal_ok = 'newLayerCommandOptionModal.ok';
            this.newLayerCommandOptionModal_cancel = 'newLayerCommandOptionModal.cancel';
        }
        return HTMLElementID;
    }());
    var DrawLineToolSubToolID;
    (function (DrawLineToolSubToolID) {
        DrawLineToolSubToolID[DrawLineToolSubToolID["drawLine"] = 0] = "drawLine";
    })(DrawLineToolSubToolID || (DrawLineToolSubToolID = {}));
    var ScrathLineToolSubToolID;
    (function (ScrathLineToolSubToolID) {
        ScrathLineToolSubToolID[ScrathLineToolSubToolID["scratchLine"] = 0] = "scratchLine";
    })(ScrathLineToolSubToolID || (ScrathLineToolSubToolID = {}));
    var ModalToolID;
    (function (ModalToolID) {
        ModalToolID[ModalToolID["none"] = 0] = "none";
        ModalToolID[ModalToolID["grabMove"] = 1] = "grabMove";
        ModalToolID[ModalToolID["ratate"] = 2] = "ratate";
        ModalToolID[ModalToolID["scale"] = 3] = "scale";
        ModalToolID[ModalToolID["latticeMove"] = 4] = "latticeMove";
        ModalToolID[ModalToolID["countOfID"] = 5] = "countOfID";
    })(ModalToolID || (ModalToolID = {}));
    var _Main;
    window.onload = function () {
        _Main = new Main();
        _Main.mainWindow.canvas = document.getElementById('mainCanvas');
        _Main.editorWindow.canvas = document.getElementById('editorCanvas');
        _Main.layerWindow.canvas = document.getElementById('layerCanvas');
        _Main.webglWindow.canvas = document.getElementById('webglCanvas');
        _Main.pickingWindow.canvas = document.createElement('canvas');
        //document.getElementById('footer').appendChild(_Main.pickingWindow.canvas);
        _Main.onLoad();
        setTimeout(run, 1000 / 30);
    };
    function run() {
        if (_Main.mainProcessState == MainProcessStateID.Running) {
            _Main.run();
            _Main.draw();
        }
        else if (_Main.mainProcessState == MainProcessStateID.SystemResourceLoading) {
            _Main.processLoadingSystemResources();
        }
        else if (_Main.mainProcessState == MainProcessStateID.InitialDocumentJSONLoading) {
            _Main.processLoadingDocumentJSON();
        }
        else if (_Main.mainProcessState == MainProcessStateID.DocumentResourceLoading
            || _Main.mainProcessState == MainProcessStateID.InitialDocumentResourceLoading) {
            _Main.processLoadingDocumentResources();
        }
        setTimeout(run, 1000 / 60);
    }
})(ManualTracingTool || (ManualTracingTool = {}));
