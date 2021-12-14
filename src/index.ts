import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { App_Main, MainProcessStateID } from './app/main'
import { LocalSetting } from './app/preferences/local_setting'
import { UserSettingLogic } from './app/preferences/user_setting'
import { MainCommandButtonID } from './app/window/constants'
import { UserStorage } from './platform/user_strage'
import { UI_ColorMixerWindow } from './app/ui/color_mixer_window'
import { UI_Dialog_DocumentFiler } from './app/ui/dialog_document_filer'
import { UI_FooterOperationPanel } from './app/ui/footer_operation_panel'
import { UI_HeaderWindow } from './app/ui/header_window'
import { UI_LayerWindow } from './app/ui/layer_window'
import { UI_PaletteSelectorWindow } from './app/ui/palette_selector_window'
import { UI_RibbonUI } from './app/ui/ribbon_ui'
import { UI_SideBarContainer } from './app/ui/side_bar_container'
import { UI_Modals } from './app/ui/modals'

// 大改修計画
// ・直近の仮題と対応
//   ・リボンＵＩの見た目をそれっぽいレベルにする
//     ・ポージングレイヤーのとき以外はサブツールウィンドウを非表示  →  OK
//     ・消しゴムの半径の設定項目を追加、反映する  →  OK
//     ・アイコンの作成
//       ・線/線分/点の選択
//       ・移動/変形
//       ・再分割
//       ・太さを足す
//       ・太さの上書き
//       ・エクスポート範囲の設定
//       ・ファイル参照レイヤーのファイル選択
//   ・顔の左右対称描き機能を作る
//     ・ベクターレイヤーの機能として作る  →  OK
//   ・よく使う機能を固める
//     ・線の修正ツールでドラッグしないクリックをした場合、線を選択する
//     ・太さの修正ツール  →  もっと直感的にする
//     ・再分割  →  わかりやすくする…プレビューみたいな表示？
//     ・選択/編集単位をリボンに入れる
//     ・選択ブラシの半径をリボンに入れる
//     ・ビューのリセットを左手用ＵＩでできるようにする
//     ・ラティス変形ツールで移動や回転をマウスだけでできるようにする  →  フロートボタンを表示する
//   ・ダイアログのリニューアル、共通化
//     ・レイヤーの設定
//       ・変更が即反映されるように、ダイアログではなくウィンドウにする？
//     ・編集単位などの設定ダイアログは削除
//     ・ドキュメントの設定  →  可能ならリボンに入れる
//   ・コンボボックスを別のライブラリにする
//   ・スライダーを別のライブラリにする
//   ・oraファイルのサムネイルで左右対称が正しく出ていない
// ・ビューの状態をドキュメントに保存する
//   ・ビューの状態を複数管理できるようにする
// ・新規作成テンプレート、最近使ったファイル、ファイルを開く、保存する画面
//   ・ソース、フォルダ、ファイルの３階層にする→デスクトップ、モバイルの両方に対応できる
//   ・ソースにデフォルトで「最近使ったファイル」があるようにする。そこを最初に表示する。
//   ・デスクトップでは実ディスクのファイルを参照できるようにする→ソールにはお気に入りを登録できるようにする  →  OK
//   ・モバイルでは仮想的な階層となる→ソースは単なる１階層目のフォルダ、２階層目にはファイルかフォルダを置ける、三階層目はファイルのみ
//   ・リストを表示できるビューをコンポーネントにする
//   ・サムネイルを表示できるビューをコンポーネントにする
//   ・ファイルの保存、エクスポートはフォルダ指定やファイル名の指定という意味では保存と似ている同じだが、違う部分もある。
//     初期表示の指定はそれぞれ持つほうがよいだろう。
//     エクスポート先は最近使った場所とは別に記憶されていると便利。
//     モバイル対応を考えるとファイル名の入力欄は画面の上のほうに置いた方がいい。
//     エクスポートは毎回保存先の指定画面を出さなくていい。エクスポート画面でＯＫを押したら確認せずに保存していい。保存先の指定ボタンを用意する。
// ・塗りつぶし機能の拡充
//   ・描画グループを単位として描画するようにする
//     ・データ構造の変更
//       VectorLayerGeometry → VectorGeometry
//                           → VectorDrawingUnit
//       VectorGroup         → VectorStrokeGroup
//       VectorLine          → VectorStroke
//       LinePoint           → VectorPoint
//       StrokeFillType: fill, holeFill
//     ・データのコンバート処理を作る
//       ・連結描画しないLine、連結描画するLineをそれぞれまとめてStrokeGroupに入れ、それをDrawingUnitに入れる（一つのDrawingUnitに一つのStrokeGroupが入った状態になる）
//     ・DrawingUnitごとに描画するようにする
//   ・DrawingUnit、StrokeGroupの編集処理
//     ・DrawingUnit、StrokeGroupを可視化する
//       ・Drawモードで選択可能にする。選択した瞬間だけ矩形と強調表示で示す。また、画面上部で選択中のユニットの可視化をON/OFF可能にする
//       ・切り取り、貼り付けなどをしたときの処理を実装する
//       ・編集単位を画面の上部で変更できるようにする。描画単位、ストロークグループ単位を追加
//       ・Editモードで描画単位、ストロークグループの可視化
//         ・マウス移動時に近接する対象を強調表示する
//     ・DrawingUnitを編集処理のループの中に足す
//   ・StrokeGroupの頂点や線の削除をしても正しくなるようにする
//     ・StrokeGroupの中で最も近い位置のStrokeが連結描画されるように再構築する処理を実装する
//   ・holeFillを描画できるようにする
//     ・Strokeのがfillのときは右回り、holeFillのときは左回りになるように自動的に再構築する処理を実装する
//   ・ブラシ塗りの実装
//  ・ポージング３Ｄ機能の拡充
//    ・モデルのカスタマイズ
//      ・パーツモデルのカスタマイズ
//      ・プロポーションのカスタマイズ
//      ・フロートボタンの実装
//        ・手前と奥の切替
//        ・入力解除
//     ・人形の移動、回転、拡大縮小を可能にする
//     ・親の向きに合わせて子も回転してしまう（していい部位もある）のでどうにかする
// ・線描画ツールで角度がきついところで自動的に線を分割する機能の追加
// ・文字入れ機能の追加
//   ・それぞれの文字入れをプロパティパネルとして表示する
// ・プロパティウィンドウを実装する
//   ・ドキュメント/レイヤーの種類に応じた設定項目を表示する
//   ・ドキュメントを選択中の場合、ファイル名やエクスポートの設定などを表示する
//   ・ベクターレイヤーの場合はその設定を表示する
//   ・ベクター参照レイヤーの場合はその設定を表示する
//   ・ポージング3Dレイヤーの場合は各パーツの設定用のパネルを表示する
// ・ウィンドウの配置を変えられるようにする、またはウィンドウ種類を変更できるようにする
// ・レイヤーウィンドウをアウトライナーウィンドウにして、レイヤー以外の情報も表示できるようにする
//   ・ドキュメントをルートに表示し、それを選択しているときにドキュメントフレームなどドキュメント設定を編集できるメインツールにする
// ・ファイルの読み書きの高速化
//   ・現状はjsでzip圧縮をしているので速くはない→Electron環境ではNode.jsの機能を使い、モバイルアプリではＯＳの機能を活用するなどして高速化したい

// どこかでやる必要があること (nearest future tasks)
// ・名称の再考。ToolContextをDocumentContext、ToolEnvironmentをSubToolContextに変更する。
// ・ファイル管理
//   ・デフォルトの線の太さ設定の保存
//   ・デフォルトのエクスポート倍率設定の保存
//   ・デフォルトの設定のプリセットを選択できるようにする
//   ・指定フォルダ以下のファイルの列挙表示、読み込み
//   ・ファイルを指定してのドキュメント読み込み
//   ・ファイルを指定してのドキュメント保存
//   ・ドキュメントフレームの表示設定
// ・Web向け仕様
//   ・Webで保存をダウンロード、読み込みをブロブにする
// ・グループレイヤーを選択したとき一定時間選択レイヤーだけを表示するときグループレイヤー以下のレイヤー全てを表示対象とする（今はグループレイヤーしか表示されない）
// ・グループレイヤーを選択したときそれ以下のレイヤーをまとめて編集できるようにする…ベクターレイヤーだけならできるだろうけど他の種類のレイヤーも一緒に編集するのは無理？
// ・エディットモードの各モードでラティスを表示して変形をすぐできるようにする（今はラティス変形ツールに行かないとできない）
// ・モバイル対応
//   ・タッチ操作をきちんとする
//   ・画面サイズによってはダイアログがまともに表示されない問題の対応
//   ・safariのタッチ操作の350ms遅延対策をする。wiewportwidthでできるかもしれないし、userscalable=falseかもしれないし、ライブラリを使うのが楽かもしれない。
// ・collectEditTargetViewKeyframeLayersは何度も実行する必要はないのだが、選択状態が変わったりするたびに更新する必要があり辛いので現状リストを生成しているのでなんとかしたい
// ・コードの全体的構造の整理
//   ・ImageResourceがPoing3Dに依存しているのをどうにかしたい
//   ・複数レイヤー選択、グループレイヤー選択時の全てのツールの動作確認修正
// ・Render2DのtrnasformMatrixの更新やコピーのタイミングが分かりづらすぎる。というかRender2Dも3Dも描画関係はもうわけわからん…なんとかしる！
// ・enumを<int>でキャストしているところは厳密といえばそうだがどうなのか
// ・レイヤーのピッキング時、マスクされている箇所でもヒットするので、マスクも考慮した処理にする必要があるか？描画パスを使用する。
// ・ドキュメントフレームの設定をリボンUIから変更した場合、アンドゥが実装されていないので実装する。

// 既知のバグ (remaining bugs)
// ・グループレイヤー
//   ・グループレイヤー下のレイヤーがレイヤーウィンドウで一番下にあるとき下移動でグループを抜け出せない
//   ・グループレイヤー選択時に、線の延長ツールでキャンバスをクリックするとエラーになる
//   ・画面が最初に開いたときに選択されるレイヤーがグループレイヤーだと、メインツールのタブにベクターレイヤーのタブが表示されないが、
//     メインツールのIDとしてはベクターレイヤーのツールが選択されていて、その状態から別のベクターレイヤーを選択してもメインツールのIDが変わらないのでタブの
//     更新処理が動かず（setCurrentMainToolの中でif文で制御している）、ベクターレイヤーのメインツールのタブが表示されない
//     グループレイヤーが選択されたときメインツールをnoneに設定することでタブが切り替わるようにすることは可能だが、リボンが空になり、見た感じが良くない。
//     とりあえずグループレイヤーをUIの表示に関してはベクターレイヤーと同じ条件文に入れるようにしたが、贅沢をいえばグループレイヤーなりの操作ができるリボンでツールもそれに対応していることが理想だろう。遠い。
// ・頂点を短い線で描画しているが、ビューの拡大率が大きいと長くなって線であることがわかってしまう
// ・編集単位が辺のときでも線全体が選択色で表示される
// ・レイヤーウィンドウでレイヤー移動時にグループの中に入れなくなっている
// ・点の移動ツールなどで右クリックでキャンセルしたときに点の位置がモーダル中の位置で表示されつづけていた
// ・線の連続塗りつぶしで後ろの線が削除されたときにフラグを解除していない
// ・セグメント単位の選択ツールで選択されているセグメント単位に色が変わらず線単位で色が変わっている
// ・座標計算でzが0.0でなくなる場合があるらしい。どこでそうなっているのか未調査手掛かりなし。
// ・編集単位が辺単位のときの表示が線単位になっていうｒ
// ・線のレンダリングで端点は隣の点のエッジをミラーしているが、太さが考慮されたエッジをコピーしているので端点より内側が細いとたぶんおかしくなる
// ・oraファイルを読み込んだときに最近使ったファイルのリストが更新されていないらしい

// いつかやるかも (anytime tasks)
// ・アクティブ線、レイヤによる絞り込み処理と可視化
// ・ミラー（上下反転）表示
// ・線の太さに変化がある線を品質よく描画する
// ・筆圧を利用した何か
// ・パレット機能の拡充
//   ・パレット編集画面にカラーピッカーを自作する
//   ・色データを単なるRGBAではなく、表現形式や混色のベースとなる色情報まで持てるようにする
//   ・メインライト、バックライト、フィルライトのライティングによる色作成機能
// ・レイヤーカラーをどこかに表示する
// ・塗りつぶし関連
//   ・既存の線を連続塗りつぶし設定するツール
// ・編集操作
//   ・線の複製
//   ・グループの複製
//   ・レイヤーの複製
//   ・ラティス変形ツール
//   ・アンカーの表示/非表示をツールで切り替えるようにする
//   ・角度を指定した後での拡縮操作
// ・モディファイア
// ・直線の点削減アルゴリズムの改良
//   ・直線上の点は削減する
//   ・曲線が曲がった量が一定を超えたところでそこまでの部分曲線の真ん中に点を配置するという方法、部分曲線に点が一つしかない場合どうするか？

// 終わったもの (done)
// ・ = new List<T> を = [] にする
// ・グループレイヤー外のレイヤーを上移動でグループに入れるとき、グループの一番最後に挿入されるのでなく最初に挿入される不具合
// ・ドローツールで線の最後の点が重複しているときがある？（リサンプリングで最後と同じ位置に点が追加されている？）
// ・ポージング
//   ・ポージングレイヤーの透明度
//   ・ポージングで頭の角度の入力で画面の回転に対応する
// ・ベクターレイヤー参照レイヤーが参照先のレイヤーのキーフレームの変更に追従しない。キーフレームの配列を参照しているが、配列が置き換わったときに参照を更新していないため。
// ・バッファリングによる編集中の描画の高速化とレイヤー合成モードの実装
//   ・isVisibleの階層を考慮した反映
//   ・合成モード
//   ・描画計画の作成…バッファの持ち方…枝分かれしているところは全てバッファが必要
//       …枝分かれしているところは全てバッファが必要
//       …並列でも合成モードが変化しているところはバッファが必要
//       …非表示だとしてもバッファは作っておく…あるいはもう全てのレイヤーごとにバッファを用意しておくか
//       …そうすれば常に合成モードが実現可能…ひとまずそれでいいか
//       …バッファのサイズが問題？…画面のサイズと同じでよく、ビューの変更時に全再描画する
//       …あくまで作業の高速化であるならば、編集中のレイヤーの上下だけレイヤーであればよい
// ・パレット１、２ボタンをレイヤーウィンドウに置く→パレット選択ウィンドウ実装により不要となった
// ・ファイル管理
//   ・デフォルトのズーム倍率の設定の保存
//   ・線の基本幅の倍率
// ・ミラー（左右反転）表示
//   ・キーフレームの編集がレイヤーごとにきちんと適用されているか確認
// ・不具合
//   ・ポージングツール以外のツールでパンしたとき３Ⅾが更新されない
//   ・非表示時に入力スフィアをも非表示にする（不具合）
//   ・点が一つしかない（あるいは同じ座標にある？）線が残ることがあるのを直したい
// ・PNG出力、jpeg出力
//   ・出力倍率を指定できるようにする、ドキュメントに記録する
//   ・出力ファイル名を指定するダイアログを実装する。ついでに出力範囲の値指定も同じダイアログでできるようにする
// ・編集ツールの整備
//   ・グループレイヤーによる複数レイヤー同時編集
//     ・編集モード表示の複数レイヤー対応
//     ・編集モード用のツールを作成、モーダル状態にして複合した編集操作をまとめたコマンドにまとめるようにする。Enterで確定？
//     ・選択矩形の辺を掴んでの変形の実装
//       ・ついでにドキュメントフレームの設定も同じ仕組みを利用して指定できるように考える
//   ・複数レイヤー選択による複数レイヤー同時編集
// ・メインツールUIの仕様変更
//   ・現在のレイヤーが変わったときにメインツールを自動で変更する
//   ・ヘッダ部のコントロールを「Drawing」「Edit」「Misc」の三つに変更、Editのとき今までの編集モードにする。ヘッダ部クリックかTabで切り替わるようにする。
// ・線の太さを変えられるツールを追加
//   ・固定の太さで上書きする機能、選択中の点に上書きする
//   ・筆圧を線の太さに影響できるようにするとどうなるか試す
// ・アニメーション機能
//   ・キーフレームウィンドウを追加
//     ・キーフレームを削除できるようにする
//     ・キーフレームを移動できるようにする
//   ・ドキュメントにキーフレーム情報を追加
//   ・レイヤーのジオメトリにキーフレーム情報を追加
// ・エクスポートの整備
//   ・ファイル名を指定してのエクスポート
//   ・拡大率を指定してエクスポート
//   ・背景色を指定する
//   ・エクスポートの描画位置がバグっているので直す（不具合）
// ・ポージングツールの整備
//   ・ポージングツール以外のツールでパンしたとき３Ⅾを更新する
//   ・複数のポージングレイヤーの描画
// ・塗りつぶし機能の追加
//   ・連続する線として設定した線を接続して塗りつぶすことができる機能（複数の線の間を塗りつぶす機能の簡易版ともいえる）
// ・描画ツールの追加
//   ・点削除ブラシツール（線の点をブラシ選択の要領で削除できる）
//   ・線の非表示ツール（線の幅を0にして描画のみしないようにできる）
// ・ツールの整理
//   ・ポージングツールのツールが表示しきれていないのでサブツールウィンドウをスクロール可能にする
// ・パレット機能の実装
//   ・線色と塗りつぶし色それぞれパレット色モードを選択できるようにする
//   ・パレット編集ダイアログを実装する。２５色最初から生成されていて、そこから選ぶ。
// ・レイヤーに線と塗りつぶしの描画オプションを実装する
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
//   ・線の延長を別ツールにする
// ・線スクラッチの線修正ツールを実用的な使いやすさにする
//   ・編集線上に近接位置がない点への影響度のフォールオフを無くしたり、大きくしたりしてみる
//   ・線の延長の最初の点の扱いを調整する
//   ・スクラッチツールで途中の点が一部だけギリギリ遠いために編集の対象にならないときがあるが、それをどうにかしたい→法線方向の影響範囲を大きくとることにした
// ・線の太さを変えられるツールを追加
//   ・基本の線の太さ、筆圧での最小最大幅（割合）を設定できるようにする。設定ダイアログに追加。
// ・ファイル保存、読み込み
//   ・ローカルストレージの設定のファイルに書き込む
//   ・出力する範囲を設定するツールを実装する
// ・PNG出力、jpeg出力
//   ・出力用のCanvasを用意し、出力サイズにサイズを変更し、画像ファイルを保存する
// ・リサンプリングツールで線の太さがビューのスケールに応じて変わってしまっている？→スムージング処理中の不具合だった
// ・線スクラッチの点削減ツールの実現

let _Main: App_Main

window.onload = () => {

  loadSetings()
   .then(() => {
      initializeMain()
      setTimeout(run, 1000 / 30)
   })
}

async function loadSetings() {

  const defaultUserData = {
    version: '0.1.1',
    [UserSettingLogic.localStorage_ActiveSettingNameKey]: 'setting1',
    setting1: {
      currentDirectoryPath: './',
      referenceDirectoryPath: './test',
      exportPath: './',
      maxLastUsedFilePaths: 10,
      lastUsedFilePaths: [
        './test/test01_app_demo.v.ora',
        './test/test02_eyes_symmetry.v.ora',
      ],
      fileSections: []
    } as LocalSetting
  }

  await UserStorage.load(defaultUserData)
}

function initializeMain() {

  _Main = new App_Main()
  _Main.appView.mainWindow.canvas = <HTMLCanvasElement>document.getElementById(_Main.appView.ID.mainCanvas)
  _Main.appView.editorWindow.canvas = <HTMLCanvasElement>document.getElementById(_Main.appView.ID.editorCanvas)
  _Main.appView.webglWindow.canvas = <HTMLCanvasElement>document.getElementById(_Main.appView.ID.webglCanvas)
  _Main.appView.timeLineWindow.canvas = <HTMLCanvasElement>document.getElementById(_Main.appView.ID.timeLineCanvas)
  ReactDOM.render(
    React.createElement(UI_HeaderWindow, { uiRef: _Main.appView.headerWindow.uiHeaderWindowRef })
    , document.getElementById(_Main.appView.ID.header)
  )

  ReactDOM.render(
    React.createElement(UI_RibbonUI, {
      uiRef: _Main.appView.ribbonUIWindow.uiRibbonUIRef,
      menuButtonsRef: _Main.appView.ribbonUIWindow.uiRibbonUITabsRef,
      subToolWindowRef: _Main.appView.subToolWindow.uiSubToolWindowRef,
    })
    , document.getElementById(_Main.appView.ID.ribbonUI)
  )

  ReactDOM.render(
    React.createElement(UI_FooterOperationPanel, {
      uiRef: _Main.appView.footerWindow.uiFooterOperationpanelRef
    })
    , document.getElementById(_Main.appView.ID.footerUI)
  )

  ReactDOM.render(
    React.createElement(UI_SideBarContainer,
      {
        dockingTo: 'left',
        contents: [
        ],
        uiRef: _Main.appView.uiSideBarContainerRef,
      })
    , document.getElementById("left-side-panel")
  )

  ReactDOM.render(
    React.createElement(UI_SideBarContainer,
      {
        dockingTo: 'right',
        contents: [
          { key: 1, id: MainCommandButtonID[MainCommandButtonID.layerWindow], component: UI_LayerWindow, uiRef: _Main.appView.layerWindow.uiRef, icon: 'layers', isOpened: true },
          { key: 2, id: MainCommandButtonID[MainCommandButtonID.paletteWindow], component: UI_PaletteSelectorWindow, uiRef: _Main.appView.paletteSelectorWindow.uiRef, icon: 'palette', isOpened: true },
          { key: 3, id: MainCommandButtonID[MainCommandButtonID.colorMixerWindow], component: UI_ColorMixerWindow, uiRef: _Main.appView.colorMixerWindow.uiRef, icon: 'colorize', isOpened: false}
        ],
        uiRef: _Main.appView.uiSideBarContainerRef,
      })
    , document.getElementById("right-side-panel")
  )

  ReactDOM.render(
    React.createElement(UI_Modals, { uiRef: _Main.appView.modalWindow.uiRef })
    , document.getElementById("modal-window")
  )

  ReactDOM.render(
    React.createElement(UI_Dialog_DocumentFiler, { uiRef: _Main.appView.uiDialogDocumentFilerRef })
    , document.getElementById("file-open-dialog")
  )

  _Main.appView.colorMixerWindow.colorCanvas.canvas = <HTMLCanvasElement>document.getElementById(_Main.appView.ID.colorMixerWindow_colorCanvas)

  _Main.onInitializeSystemDevices()
}

function run() {

  try {

    if (_Main.mainProcessState == MainProcessStateID.pause) {

      setTimeout(run, 1000)
      return
    }
    else if (_Main.mainProcessState == MainProcessStateID.running) {

      _Main.run()
      _Main.draw()
    }
    else if (_Main.mainProcessState == MainProcessStateID.systemResourceLoading) {

      _Main.processLoadingSystemResources()
    }
    else if (_Main.mainProcessState == MainProcessStateID.documentJSONLoading) {

      _Main.processLoadingDocumentFile()
    }
    else if (_Main.mainProcessState == MainProcessStateID.documentResourceLoading) {

      _Main.processLoadingDocumentResources()
    }

    if (_Main.docContext != null && _Main.docContext.animationPlaying) {

      setTimeout(run, 1000 / _Main.docContext.animationPlayingFPS)
    }
    else {

      window.requestAnimationFrame(run)
    }
  }
  catch (e) {
    console.log(e)
    setTimeout(run, 1000)
  }
}
