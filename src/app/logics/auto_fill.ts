import { VectorStroke, VectorPoint, VectorGeometry, VectorLineModifyFlagID, LinePointModifyFlagID } from '../document_data'
import { ViewKeyframeLayer } from '../view/view_keyframe'
import { float, int } from './conversion'
import { Logic_Edit_Line, Logic_Edit_VectorLayer } from './edit_vector_layer'
import { HitTest_Line_PointToLineByDistanceNearest } from './hittest'
import { Maths } from './math'
import { Logic_Points } from './points'
import { Logic_Stroke } from './stroke'

class AutoFillSearchState {

  startLocation = vec3.fromValues(0.0, 0.0, 0.0)
  points: VectorPoint[] = []
  start_PointIndex: int = -1
  end_PointIndex: int = -1

  constructor(
    public targetStroke: VectorStroke,
    public start_SegmentIndex: int,
    public isForwardSearch: boolean,
    start_Location: Vec3,
    public previousState: AutoFillSearchState,
  ) {

    vec3.copy(this.startLocation, start_Location)
  }

  addPoint(location: Vec3) {

    const point = new VectorPoint()
    vec3.copy(point.location, location)
    vec3.copy(point.adjustingLocation, location)
    this.points.push(point)
  }
}

export class Logic_AutoFill {

  static lineNearestHitTester = new HitTest_Line_PointToLineByDistanceNearest()

  static currentLocation = vec3.fromValues(0.0, 0.0, 0.0)
  static lastLocation = vec3.fromValues(0.0, 0.0, 0.0)
  static strokeStartLocation = vec3.fromValues(0.0, 0.0, 0.0)
  static nearestLocation = vec3.fromValues(0.0, 0.0, 0.0)
  static crossingLocation = vec3.fromValues(0.0, 0.0, 0.0)

  static lastSegmentLocationFrom = vec3.fromValues(0.0, 0.0, 0.0)
  static lastSegmentLocationTo = vec3.fromValues(0.0, 0.0, 0.0)

  static generate(
    resultStroke: VectorStroke,
    resultLookDirection: Vec3,
    start_Location: Vec3,
    mouseCursorViewRadius: float,
    minDistanceRange: float,
    sibling_ViewKeyframeLayers: ViewKeyframeLayer[]
  ) {

    // 最も近いストロークを検索
    let start_Stroke: VectorStroke = this.findStartStroke(start_Location, mouseCursorViewRadius, sibling_ViewKeyframeLayers)

    if (start_Stroke == null) {
      return false
    }

    // 処理対象のストロークを全て配列に取得
    const target_Strokes = this.getTargetStrokes(sibling_ViewKeyframeLayers)

    // スタートのセグメントの決定
    const start_SegmentIndex = Logic_Stroke.getNearestSegmentIndex(
      start_Stroke,
      start_Location
    )

    if (start_SegmentIndex == Logic_Stroke.InvalidIndex) {
      return false
    }

    // フラグのクリア
    for (const stroke of target_Strokes) {
      Logic_Edit_VectorLayer.clearLineModifyFlags(stroke)
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
    let searchState: AutoFillSearchState = null
    let available_SearchState: AutoFillSearchState = null
    while (searchStateStack.length > 0) {

      searchState = searchStateStack.pop()

      const current_Stroke = searchState.targetStroke
      const current_SegmentIndex = searchState.start_SegmentIndex
      const current_IsForwardSearch = searchState.isForwardSearch
      vec3.copy(this.strokeStartLocation, searchState.startLocation)
      vec3.copy(this.currentLocation, searchState.startLocation)

      // 検索する範囲が無いステートは即終了（ステートの作成時に判定せずここで判断することでまとめて判断しています）
      if ((current_IsForwardSearch && current_SegmentIndex + 1 >= current_Stroke.points.length)
      || (!current_IsForwardSearch && current_SegmentIndex < 0)) {
        continue
      }

      // 現在のストロークと交差する可能性のあるストロークを列挙
      const candidate_Strokes = target_Strokes.filter(stroke =>
        stroke != current_Stroke
          && Logic_Stroke.hitTestStrokeToStrokeByRectangle(current_Stroke, stroke, minDistanceRange)
      )

      // ストロークのセグメントの探索
      let next_Stroke: VectorStroke = null
      let next_SegmentIndex = -1
      let search_PointIndex = current_IsForwardSearch ? current_SegmentIndex + 1 : current_SegmentIndex
      let searched_Start_PointIndex = search_PointIndex
      let searched_Last_PointIndex = search_PointIndex
      {
        let currentSegment_Candidate_Stroke: VectorStroke = null
        let currentSegment_Candidate_SegmentIndex = -1
        let currentSegment_Candidate_Distance = -1
        while (true) {

          const pointTo = current_Stroke.points[search_PointIndex]

          vec3.copy(this.lastLocation, this.currentLocation)
          vec3.copy(this.currentLocation, pointTo.location)

          searched_Last_PointIndex = search_PointIndex

          const nearToSegment_Strokes = candidate_Strokes.filter(stroke =>
            Logic_Stroke.hitTestLocationToStrokeByRectangle(this.lastLocation, stroke, minDistanceRange)
            || Logic_Stroke.hitTestLocationToStrokeByRectangle(this.currentLocation, stroke, minDistanceRange)
          )

          // 現在のセグメントに対する最も近接するストロークとセグメントを検索
          let minDistance_Stroke: VectorStroke = null
          let minDistance_SegmentIndex = -1
          let minDistance = -1
          for (const stroke of nearToSegment_Strokes) {

            const segment_NearestSegmentIndex = Logic_Stroke.getNearestSegmentIndex(stroke, this.currentLocation)

            if (segment_NearestSegmentIndex == Logic_Stroke.InvalidIndex) {
              continue
            }

            const segment_NearestPointFrom = stroke.points[segment_NearestSegmentIndex]
            const segment_NearestPointTo = stroke.points[segment_NearestSegmentIndex + 1]

            if (segment_NearestPointFrom.modifyFlag == LinePointModifyFlagID.edit
              && segment_NearestPointTo.modifyFlag == LinePointModifyFlagID.edit) {
              continue
            }

            const distance = Logic_Points.pointToLineSegment_SorroundingDistance(
              segment_NearestPointFrom.location,
              segment_NearestPointTo.location,
              this.currentLocation
            )

            if (distance > minDistanceRange) {
              continue
            }

            if (minDistance == -1 || distance < minDistance) {

              minDistance_Stroke = stroke
              minDistance_SegmentIndex = segment_NearestSegmentIndex
              minDistance = distance
            }
          }

          // 次のストローク候補として最も距離の近いストロークを記憶、いったん近づいたストロークが離れたかの判定
          let segement_Leaved = false
          let newCandidateSegment = false
          if (currentSegment_Candidate_Stroke != null) {

            if (minDistance_Stroke == null) {

              segement_Leaved = true
            }
            else {

              if (minDistance > currentSegment_Candidate_Distance) {

                segement_Leaved = true
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

            currentSegment_Candidate_Stroke = minDistance_Stroke
            currentSegment_Candidate_SegmentIndex = minDistance_SegmentIndex
            currentSegment_Candidate_Distance = minDistance
            vec3.copy(this.lastSegmentLocationTo, this.currentLocation)
            vec3.copy(this.lastSegmentLocationFrom, this.lastLocation)
          }

          // 既に探索済みの点に到達した場合、ループ完成
          isLoopFinished = (
            search_PointIndex >= 0
            && search_PointIndex < current_Stroke.points.length
            && current_Stroke.points[search_PointIndex].modifyFlag == LinePointModifyFlagID.edit
          )

          // ループ完成または現在のストロークの終端まで到達した場合、セグメントの探索を終了
          const isSegmentSearchEnd = (
            isLoopFinished
            || search_PointIndex <= 0
            || search_PointIndex >= current_Stroke.points.length - 1
          )

          let isCrossing = false
          if (minDistance_Stroke != null) {

            isCrossing = Logic_Points.lineToLine_CrossPoint(
              this.crossingLocation,
              this.lastLocation,
              this.currentLocation,
              minDistance_Stroke.points[minDistance_SegmentIndex].location,
              minDistance_Stroke.points[minDistance_SegmentIndex + 1].location
            )
            }

          if (isSegmentSearchEnd || isCrossing) {

            currentSegment_Candidate_Stroke = minDistance_Stroke
            currentSegment_Candidate_SegmentIndex = minDistance_SegmentIndex
            currentSegment_Candidate_Distance = minDistance
            vec3.copy(this.lastSegmentLocationTo, this.currentLocation)
            vec3.copy(this.lastSegmentLocationFrom, this.lastLocation)
          }

          // セグメントの探索終了またはいったん近づいたストロークが離れた場合、次のストロークを確定
          if (isSegmentSearchEnd || segement_Leaved) {

            next_Stroke = currentSegment_Candidate_Stroke
            next_SegmentIndex = currentSegment_Candidate_SegmentIndex
            break
          }

          // 次のセグメントに移動
          search_PointIndex = current_IsForwardSearch ? search_PointIndex + 1 : search_PointIndex - 1
        }
      }

      // ステートの範囲の決定
      searchState.start_PointIndex = Math.min(searched_Start_PointIndex, searched_Last_PointIndex)
      searchState.end_PointIndex = Math.max(searched_Start_PointIndex, searched_Last_PointIndex)

      // 塗りつぶし頂点を追加、フラグを設定
      searchState.addPoint(this.strokeStartLocation)

      for (let index = searched_Start_PointIndex;;) {

        const point = current_Stroke.points[index]
        searchState.addPoint(point.location)

        point.modifyFlag = LinePointModifyFlagID.edit

        if (index == searched_Last_PointIndex) {
          break
        }

        index += current_IsForwardSearch ? 1 : -1
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

        // 交点を計算
        const next_PointIndexFrom = next_SegmentIndex
        const next_PointIndexTo = next_SegmentIndex + 1
        const isCrossing = Logic_Points.lineToLine_CrossPoint(
          this.crossingLocation,
          this.lastSegmentLocationFrom,
          this.lastSegmentLocationTo,
          next_Stroke.points[next_PointIndexFrom].location,
          next_Stroke.points[next_PointIndexTo].location
        )

        console.log(`is crossing?`, isCrossing, this.crossingLocation[0], this.crossingLocation[1])

        if (isCrossing) {

          const next_IsForwardSearch = Logic_Points.isClockwise(
            this.lastSegmentLocationFrom,
            this.crossingLocation,
            next_Stroke.points[next_PointIndexTo].location
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
            current_IsForwardSearch ? searched_Last_PointIndex - 1 : searched_Last_PointIndex,
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

          // 塗りつぶし頂点を追加
          searchState.addPoint(this.lastSegmentLocationTo)

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

        // console.debug('7-1 next stroke', next_Stroke, next_SegmentIndex, isForwardSearch)
      }
      else {

        available_SearchState = searchState

        searchState.addPoint(this.currentLocation)
      }
    }

    // フラグのクリア
    for (const stroke of target_Strokes) {
      Logic_Edit_VectorLayer.clearLineModifyFlags(stroke)
    }

    // 結果を設定
    const stateList: AutoFillSearchState[] = []
    if (available_SearchState != null) {

      let state = available_SearchState
      while (state != null) {

        stateList.push(state)
        state = state.previousState
      }
    }
    stateList.reverse()
    stateList.forEach(state => state.points.forEach(point => resultStroke.points.push(point)))

    Logic_Edit_Line.calculateParameters(resultStroke)

    return true
  }

  private static findStartStroke(startLocation: Vec3, mouseCursorViewRadius: float, viewKeyframeLayers: ViewKeyframeLayer[]) {

    let startStroke: VectorStroke = null
    let hitedDistanceSQ: float = -1

    ViewKeyframeLayer.forEachGeometry(viewKeyframeLayers, (geometry: VectorGeometry) => {

      this.lineNearestHitTester.startProcess()
      this.lineNearestHitTester.processGeometry(geometry, startLocation, mouseCursorViewRadius)

      if (this.lineNearestHitTester.hitedLine != null) {

        if (hitedDistanceSQ == -1 || this.lineNearestHitTester.minDistanceSQ < hitedDistanceSQ) {

          hitedDistanceSQ = this.lineNearestHitTester.minDistanceSQ
          startStroke = this.lineNearestHitTester.hitedLine
        }
      }
    })

    return startStroke
  }

  private static getTargetStrokes(viewKeyframeLayers: ViewKeyframeLayer[]) {

    const target_Strokes: VectorStroke[] = []

    ViewKeyframeLayer.forEachGeometry(viewKeyframeLayers, (geometry: VectorGeometry) => {

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

  private static isForwardSearch(resultNearestLocation: Vec3, currentLocation: Vec3, from_Location: Vec3, to_Location: Vec3): boolean {

    const normalizedPosition = Logic_Points.pointToLineSegment_NormalizedPosition(
      from_Location,
      to_Location,
      currentLocation
    )

    if (normalizedPosition < 0.0) {

      vec3.copy(resultNearestLocation, from_Location)
      return true
    }
    else if (normalizedPosition > 1.0) {

      vec3.copy(resultNearestLocation, to_Location)
      return false
    }
    else {

      const isAvailableNearestLocation = Logic_Points.pointToLine_NearestLocation(
        resultNearestLocation,
        from_Location,
        to_Location,
        currentLocation
      )

      if (!isAvailableNearestLocation) {
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

  private static isForwardSearchAtSegment(resultNearestLocation: Vec3, currentLocation: Vec3, stroke: VectorStroke, segmentIndex: int): boolean {

    const from_Point = stroke.points[segmentIndex]
    const to_Point = stroke.points[segmentIndex + 1]

    return this.isForwardSearch(
      resultNearestLocation,
      currentLocation,
      from_Point.location,
      to_Point.location
    )
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
