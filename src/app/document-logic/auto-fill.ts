import { VectorPointModifyFlagID, VectorLayer, VectorLayerGeometry, VectorPoint, VectorStroke } from '../document-data'
import { float, int, Lists, Logic_Points } from '../common-logics'
import { ViewKeyframeLayer } from '../view'
import { HitTest_VectorStroke_PointToStroke_Nearest } from './vector-layer-hittest'
import { VectorStrokeHitTestLogic, StrokeSearchResult } from './vector-stroke-hittest'
import { VectorLayerLogic } from './vector-layer'
import { VectorStrokeLogic } from './vector-stroke'

class AutoFillSearchState {

  startLocation = vec3.fromValues(0.0, 0.0, 0.0)
  points: VectorPoint[] = []
  rotationCalcPoints: VectorPoint[] = []
  start_PointIndex: int = -1
  end_PointIndex: int = -1
  totalRotation = 0.0

  constructor(
    public targetStroke: VectorStroke,
    public start_SegmentIndex: int,
    public isForwardSearch: boolean,
    start_Location: Vec3,
    public previousState: AutoFillSearchState,
  ) {

    vec3.copy(this.startLocation, start_Location)

    if (previousState != null) {

      this.totalRotation = previousState.totalRotation

      if (previousState.points.length > 0) {
        this.rotationCalcPoints.push(previousState.points[previousState.points.length - 1])
      }
    }
  }

  addPoint(location: Vec3) {

    const point = new VectorPoint()
    vec3.copy(point.location, location)
    vec3.copy(point.adjustingLocation, location)
    this.points.push(point)

    this.rotationCalcPoints.push(point)
    if (this.rotationCalcPoints.length >= 3) {

      const rotation = Logic_Points.directionAngleDifferenceOfCorner(
        this.rotationCalcPoints[this.rotationCalcPoints.length - 3].location,
        this.rotationCalcPoints[this.rotationCalcPoints.length - 2].location,
        this.rotationCalcPoints[this.rotationCalcPoints.length - 1].location,
      )

      // 局所的な探索によって180度向きが変わるような経路になってしまった場合を除外して評価値を加算
      if (rotation > -Math.PI * 0.99 && rotation < Math.PI * 0.99) {

        this.totalRotation += rotation
      }
    }
  }
}

export class AutoFillLogic {

  private static lineNearestHitTester = new HitTest_VectorStroke_PointToStroke_Nearest()

  private static currentLocation = vec3.fromValues(0.0, 0.0, 0.0)
  private static lastLocation = vec3.fromValues(0.0, 0.0, 0.0)
  private static strokeStartLocation = vec3.fromValues(0.0, 0.0, 0.0)
  private static nearestLocation = vec3.fromValues(0.0, 0.0, 0.0)
  private static crossingLocation = vec3.fromValues(0.0, 0.0, 0.0)

  private static tangentPreviousVec = vec3.fromValues(0.0, 0.0, 0.0)
  private static tangentNextVec = vec3.fromValues(0.0, 0.0, 0.0)
  private static tangentDirection = vec3.fromValues(0.0, 0.0, 0.0)
  private static tangentLocation = vec3.fromValues(0.0, 0.0, 0.0)

  private static lastSegmentLocationFrom = vec3.fromValues(0.0, 0.0, 0.0)
  private static lastSegmentLocationTo = vec3.fromValues(0.0, 0.0, 0.0)

  private static strokeSearchResult = new StrokeSearchResult()

  private static limitMinimumSegmentLength = 0.001

  static findStartStroke(startLocation: Vec3, mouseCursorViewRadius: float, viewKeyframeLayers: ViewKeyframeLayer[]) {

    let startStroke: VectorStroke = null
    let hitedDistanceSQ: float = -1

    ViewKeyframeLayer.forEachVectorGeometry(viewKeyframeLayers, (geometry, layer) => {

      this.lineNearestHitTester.startProcess()
      this.lineNearestHitTester.processGeometry(layer, geometry, startLocation, mouseCursorViewRadius)

      if (this.lineNearestHitTester.hitedStoke != null) {

        if (hitedDistanceSQ == -1 || this.lineNearestHitTester.minDistanceSQ < hitedDistanceSQ) {

          hitedDistanceSQ = this.lineNearestHitTester.minDistanceSQ
          startStroke = this.lineNearestHitTester.hitedStoke
        }
      }
    })

    return startStroke
  }

  static generate(
    resultStroke: VectorStroke,
    resultLookDirection: Vec3,
    start_Stroke: VectorStroke,
    start_Location: Vec3,
    minDistanceRange: float,
    sibling_ViewKeyframeLayers: ViewKeyframeLayer[]
  ) {

    // スタートのセグメントの決定
    const start_SegmentIndex = VectorStrokeHitTestLogic.getNearestSegmentIndex(
      start_Stroke,
      start_Location
    )

    if (start_SegmentIndex == VectorStrokeHitTestLogic.InvalidIndex) {
      return false
    }

    // 処理対象のストロークを全て取得
    const target_Strokes = this.getTargetStrokes(sibling_ViewKeyframeLayers)

    // フラグのクリア
    for (const stroke of target_Strokes) {
      VectorLayerLogic.clearStrokeModifyFlags(stroke)
    }

    // 探索方向の決定
    const start_IsForwardSearch = this.isForwardSearchAtSegment(
      this.nearestLocation,
      start_Location,
      start_Stroke,
      start_SegmentIndex
    )

    vec3.subtract(resultLookDirection, this.nearestLocation, start_Location)

    // 探索処理の初期スタックを作成
    const searchStateStack: AutoFillSearchState[] = []
    searchStateStack.push(new AutoFillSearchState(
      start_Stroke,
      start_SegmentIndex,
      start_IsForwardSearch,
      this.nearestLocation,
      null
    ))

    // 探索処理ループ
    let isLoopFinished = false
    let available_SearchState: AutoFillSearchState = null
    while (searchStateStack.length > 0) {

      const searchState = searchStateStack.pop()
      const current_Stroke = searchState.targetStroke
      const current_SegmentIndex = searchState.start_SegmentIndex
      const current_IsForwardSearch = searchState.isForwardSearch

      vec3.copy(this.strokeStartLocation, searchState.startLocation)
      vec3.copy(this.currentLocation, searchState.startLocation)

      // 検索する範囲が無い経路は即終了（経路の作成時に判定せずここで判断することでまとめて判断しています）
      if ((current_IsForwardSearch && current_SegmentIndex + 1 >= current_Stroke.points.length)
      || (!current_IsForwardSearch && current_SegmentIndex < 0)) {
        continue
      }

      // カレントのストロークと交差する可能性のあるストロークを取得
      const candidate_Strokes = target_Strokes.filter(stroke =>
        stroke != current_Stroke
          && VectorStrokeHitTestLogic.hitTestStrokeToStrokeByRectangle(current_Stroke, stroke, minDistanceRange)
      )

      // カレントのストロークのセグメントの探索
      let next_Stroke: VectorStroke = null
      let next_SegmentIndex: int = -1
      let search_PointIndex = current_IsForwardSearch ? current_SegmentIndex + 1 : current_SegmentIndex
      let searched_Start_PointIndex: int = -1
      let searched_Last_PointIndex: int = -1
      let next_IsCrossing = false
      let isSegmentSearchEnd = false
      let isRouteDiscarded = false
      {
        let candidate_Stroke: VectorStroke = null
        let candidate_SegmentIndex = -1
        let candidate_Distance = -1
        let candidate_IsCrossing = false
        while (true) {

          const pointTo = current_Stroke.points[search_PointIndex]

          // 探索の開始位置に到達した場合、ループ完成
          if (pointTo.modifyFlag == VectorPointModifyFlagID.edit) {

            isLoopFinished = (
              current_Stroke == start_Stroke
              && (
                (start_IsForwardSearch && search_PointIndex == start_SegmentIndex + 1)
                || (!start_IsForwardSearch && search_PointIndex == start_SegmentIndex)
              )
            )

            // スタート位置以外の箇所で探索済みのセグメントに到達した場合、不正な経路であるため探索を破棄
            if (!isLoopFinished) {
              isRouteDiscarded = true
              break
            }
          }

          vec3.copy(this.lastLocation, this.currentLocation)
          vec3.copy(this.currentLocation, pointTo.location)

          const nearToSegment_Strokes = candidate_Strokes.filter(stroke =>
            VectorStrokeHitTestLogic.hitTestLineSegmentToStrokeByRectangle(this.lastLocation, this.currentLocation, stroke, minDistanceRange)
          )

          const isSearchPointAtEndOfStroke = (
            (current_IsForwardSearch && search_PointIndex >= current_Stroke.points.length - 1)
            || (!current_IsForwardSearch && search_PointIndex <= 0)
          )

          // 現在のセグメントに対する最も近接するストロークとセグメントを検索
          let minDistance_Stroke: VectorStroke = null
          let minDistance_SegmentIndex = -1
          let minDistance_IsCrossing = false
          let compareDistance = -1
          for (const stroke of nearToSegment_Strokes) {

            VectorStrokeHitTestLogic.searchSegmentToSegmentNearestIndex(
              this.strokeSearchResult,
              this.lastLocation,
              this.currentLocation,
              stroke
            )

            if (this.strokeSearchResult.nearestSegmentIndex == VectorStrokeHitTestLogic.InvalidIndex) {
              continue
            }

            // 許容する隙間より離れている場合は対象としない
            if (this.strokeSearchResult.distance > minDistanceRange) {
              continue
            }

            // 探索済みの点は対象としない
            if (this.strokeSearchResult.nearestSegmentPoint != null
              && this.strokeSearchResult.nearestSegmentPoint.modifyFlag == VectorPointModifyFlagID.edit) {
              continue
            }

            // 交差点から派生した探索の最初のところで再度交差にかかることを抑制
            if (this.strokeSearchResult.isCrossing
              && vec3.distance(this.lastLocation, this.strokeSearchResult.crossingLocation) < AutoFillLogic.limitMinimumSegmentLength) {
              continue
            }

            // 最も距離の近いセグメントを選択
            if (compareDistance == -1 || this.strokeSearchResult.compareDistance < compareDistance) {

              minDistance_Stroke = stroke
              minDistance_SegmentIndex = this.strokeSearchResult.nearestSegmentIndex
              minDistance_IsCrossing = this.strokeSearchResult.isCrossing
              vec3.copy(this.crossingLocation, this.strokeSearchResult.crossingLocation)

              compareDistance = this.strokeSearchResult.compareDistance
            }
          }

          // 次のストローク候補として最も距離の近いストロークを記憶、いったん近づいたストロークが離れたかの判定
          let segement_Leaved = false
          let newCandidateSegment = false
          if (candidate_Stroke != null) {

            if (minDistance_Stroke == null) {

              // segement_Leaved = true
            }
            else {

              if (compareDistance > candidate_Distance) {

                // segement_Leaved = true
              }
              else {

                newCandidateSegment = true
              }
            }
          }
          else {

            if (minDistance_Stroke != null) {

              newCandidateSegment = true
            }
          }
          if (false && newCandidateSegment) {

            candidate_Stroke = minDistance_Stroke
            candidate_SegmentIndex = minDistance_SegmentIndex
            candidate_Distance = compareDistance
            vec3.copy(this.lastSegmentLocationTo, this.currentLocation)
            vec3.copy(this.lastSegmentLocationFrom, this.lastLocation)
          }

          // ループ完成または現在のストロークの終端まで到達した場合、セグメントの探索を終了
          isSegmentSearchEnd = (isLoopFinished || isSearchPointAtEndOfStroke)

          if (minDistance_Stroke != null && (isSegmentSearchEnd || minDistance_IsCrossing)) {

            candidate_Stroke = minDistance_Stroke
            candidate_SegmentIndex = minDistance_SegmentIndex
            candidate_Distance = compareDistance
            candidate_IsCrossing = minDistance_IsCrossing
            vec3.copy(this.lastSegmentLocationFrom, this.lastLocation)
            if (minDistance_IsCrossing) {
              vec3.copy(this.lastSegmentLocationTo, this.crossingLocation)
            }
            else {
              vec3.copy(this.lastSegmentLocationTo, this.currentLocation)
            }
          }

          // セグメントの探索終了またはいったん近づいたストロークが離れた場合、次のストロークを確定
          if (isSegmentSearchEnd || candidate_IsCrossing || segement_Leaved) {

            if (candidate_Stroke) {
              next_Stroke = candidate_Stroke
              next_SegmentIndex = candidate_SegmentIndex
              next_IsCrossing = candidate_IsCrossing
            }

            if (!candidate_IsCrossing) {
              if (searched_Start_PointIndex == -1) {
                searched_Start_PointIndex = search_PointIndex
              }
              searched_Last_PointIndex = search_PointIndex
            }
            break
          }

          // 次のセグメントに移動
          if (searched_Start_PointIndex == -1) {
            searched_Start_PointIndex = search_PointIndex
          }
          searched_Last_PointIndex = search_PointIndex
          search_PointIndex = current_IsForwardSearch ? search_PointIndex + 1 : search_PointIndex - 1
        }
      }

      // 不要な経路の破棄
      if (isRouteDiscarded) {
        continue
      }

      // 経路の範囲の決定
      searchState.start_PointIndex = Math.min(searched_Start_PointIndex, searched_Last_PointIndex)
      searchState.end_PointIndex = Math.max(searched_Start_PointIndex, searched_Last_PointIndex)

      // 塗りつぶし頂点を追加、フラグを設定
      searchState.addPoint(this.strokeStartLocation)

      if (searched_Start_PointIndex != -1) {

        for (let index = searched_Start_PointIndex;;) {

          const point = current_Stroke.points[index]
          searchState.addPoint(point.location)

          point.modifyFlag = VectorPointModifyFlagID.edit

          if (index == searched_Last_PointIndex) {
            break
          }

          index += current_IsForwardSearch ? 1 : -1
        }
      }

      // ループが完成している場合、探索を終了
      if (isLoopFinished) {

        // 塗りつぶし頂点を追加
        searchState.addPoint(this.currentLocation)

        available_SearchState = searchState
        break
      }

      // 次のストロークに移動
      if (next_Stroke != null) {

        if (next_IsCrossing) {

          const next_IsForwardSearch = Logic_Points.isClockwise(
            this.lastSegmentLocationFrom,
            this.crossingLocation,
            next_Stroke.points[next_SegmentIndex + 1].location
          )

          // 左に曲がる方向の探索
          this.pushNext(
            searchStateStack,
            searchState,
            next_Stroke,
            next_SegmentIndex,
            !next_IsForwardSearch,
            this.crossingLocation
          )

          // 正面に進む方向の探索
          this.pushNext(
            searchStateStack,
            searchState,
            current_Stroke,
            search_PointIndex,
            current_IsForwardSearch,
            this.crossingLocation
          )

          // 右に曲がる方向の探索（優先）
          this.pushNext(
            searchStateStack,
            searchState,
            next_Stroke,
            next_SegmentIndex,
            next_IsForwardSearch,
            this.crossingLocation
          )
        }
        else {

          const next_IsForwardSearch = this.isForwardSearchAtSegment(this.nearestLocation, this.lastSegmentLocationTo, next_Stroke, next_SegmentIndex)

          // 左に曲がる方向の探索
          this.pushNext(
            searchStateStack,
            searchState,
            next_Stroke,
            next_SegmentIndex,
            !next_IsForwardSearch,
            this.nearestLocation
          )

          // 右に曲がる方向の探索（優先）
          this.pushNext(
            searchStateStack,
            searchState,
            next_Stroke,
            next_SegmentIndex,
            next_IsForwardSearch,
            this.nearestLocation
          )
        }
      }

      // 最も評価値の高い経路を選択
      if (isSegmentSearchEnd) {

        if (available_SearchState == null || (available_SearchState.totalRotation < searchState.totalRotation)) {

          available_SearchState = searchState
        }
      }
    }

    // フラグのクリア
    for (const stroke of target_Strokes) {
      VectorLayerLogic.clearStrokeModifyFlags(stroke)
    }

    // 結果を生成
    const stateList: AutoFillSearchState[] = []
    if (available_SearchState != null) {

      let state = available_SearchState
      while (state != null) {

        stateList.push(state)
        state = state.previousState
      }
    }
    Lists.reverse(stateList)
    // const pointTexts: string[] = []
    for (const state of stateList) {
      // console.debug(`result state: totalRotation=${state.totalRotation}`)
      // pointTexts.push('|')
      // state.points.forEach(p => pointTexts.push(`(${p.location[0].toFixed(2)} ${p.location[1].toFixed(2)})`))
      state.points.forEach(p => resultStroke.points.push(p))
    }
    // console.debug('result stroke', pointTexts.join(' '))

    VectorStrokeLogic.calculateParameters(resultStroke)

    return true
  }

  private static getTargetStrokes(viewKeyframeLayers: ViewKeyframeLayer[]) {

    const target_Strokes: VectorStroke[] = []

    ViewKeyframeLayer.forEachVectorGeometry(viewKeyframeLayers, (geometry) => {

      for (const unit of geometry.units) {

        for (const group of unit.groups) {

          for (const stroke of group.lines) {

            target_Strokes.push(stroke)
          }
        }
      }
    })

    return target_Strokes
  }

  private static isForwardSearchAtSegment(resultNearestLocation: Vec3, currentLocation: Vec3, stroke: VectorStroke, segmentIndex: int): boolean {

    const from_PointIndex = segmentIndex
    const to_PointIndex = segmentIndex + 1

    const from_Point = stroke.points[from_PointIndex]
    const to_Point = stroke.points[to_PointIndex]

    const from_Location = from_Point.location
    const to_Location = to_Point.location

    const normalizedPosition = Logic_Points.pointToLineSegment_NormalizedPosition(
      from_Location,
      to_Location,
      currentLocation
    )

    if (normalizedPosition < 0.0) {

      const isForwardSearch = this.isForwardSearchAtSegmentCorner(
        resultNearestLocation,
        currentLocation,
        stroke,
        from_PointIndex
      )

      return isForwardSearch
    }
    else if (normalizedPosition > 1.0) {

      const isForwardSearch = this.isForwardSearchAtSegmentCorner(
        resultNearestLocation,
        currentLocation,
        stroke,
        to_PointIndex
      )

      return isForwardSearch
    }
    else {

      const isAvailable = Logic_Points.pointToLine_NearestLocation(
        resultNearestLocation,
        from_Location,
        to_Location,
        currentLocation
      )

      if (!isAvailable) {
        return true
      }

      const isForwardSearch = Logic_Points.isClockwise(
        currentLocation,
        resultNearestLocation,
        to_Location
      )

      return isForwardSearch
    }
  }

  private static isForwardSearchAtSegmentCorner(resultNearestLocation: Vec3, currentLocation: Vec3, stroke: VectorStroke, pointIndex: int): boolean {

    const center_Point = stroke.points[pointIndex]

    vec3.copy(resultNearestLocation, center_Point.location)

    const isHead = (pointIndex <= 0)
    const isTail = (pointIndex >= stroke.points.length - 1)

    if (isHead || isTail) {

      return isHead
    }

    const previous_Point = stroke.points[pointIndex - 1]
    const next_Point = stroke.points[pointIndex + 1]

    vec3.subtract(this.tangentPreviousVec, previous_Point.location, center_Point.location)
    vec3.normalize(this.tangentPreviousVec, this.tangentPreviousVec)

    vec3.subtract(this.tangentNextVec, next_Point.location, center_Point.location)
    vec3.normalize(this.tangentNextVec, this.tangentNextVec)

    vec3.subtract(this.tangentDirection, this.tangentNextVec, this.tangentPreviousVec)

    vec3.add(this.tangentLocation, center_Point.location, this.tangentDirection)

    const isForwardSearch = Logic_Points.isClockwise(
      currentLocation,
      center_Point.location,
      this.tangentLocation
    )

    return isForwardSearch
  }

  private static isAvailableToNextSearch(stroke: VectorStroke, segmentIndex: int, isForwardSearch: boolean, currentLocation: Vec3): boolean {

    const targetIndex = isForwardSearch ? segmentIndex + 1 : segmentIndex

    if (targetIndex < 0 || targetIndex >= stroke.points.length) {
      return false
    }

    const targetPoint = stroke.points[targetIndex]

    return (vec3.distance(currentLocation, targetPoint.location) > 0.0)
  }

  private static pushNext(searchStateStack: AutoFillSearchState[], currentState: AutoFillSearchState, stroke: VectorStroke, segmentIndex: int, isForwardSearch: boolean, currentLocation: Vec3) {

    if (!this.isAvailableToNextSearch(stroke, segmentIndex, isForwardSearch, currentLocation)) {
      return
    }

    searchStateStack.push(new AutoFillSearchState(
      stroke,
      segmentIndex,
      isForwardSearch,
      currentLocation,
      currentState
    ))
  }
}
