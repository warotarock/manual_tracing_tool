import { float } from '../base/conversion';

export class Maths {

  // GLSL like math functions
  static clamp(x: float, a: float, b: float): float {

    return (x < a ? a : (x > b ? b : x));
  }

  static lerp(x: float, a: float, b: float): float {

    return a + x * (b - a);
  }

  static fract(x: float): float {

    return x - Math.floor(x);
  }

  static step(edge: float, x: float): float {

    return x < edge ? 0.0 : 1.0;
  }

  static smoothstep(edge0: float, edge1: float, x: float): float {

    let t = Maths.clamp((x - edge0) / (edge1 - edge0), 0, 1);

    return t * t * (3 - 2 * t);
  }

  // Guassian
  private static gaussian(x: float, eRange: float): float {

    let d = eRange * eRange;
    let timeScale = 0.5;
    let r = 1 + 2 * x;

    return Math.exp(-timeScale * r * r / d);
  }

  // Sigmoid almost input x=0.0～1.0, it returns almopst 0.0～1.0 value
  static sigmoid10(x: float): float {

    var a = 1.0 / (1.0 + Math.exp(-20 * (x - 0.5)));

    return a;
  }

  // Half of sigmoid10 (after x=0.5)
  static sigmoid10half(x: float): float {

    return (Maths.sigmoid10(0.5 + x * 0.5) - 0.5) * 2.0;
  }

  static pointToLineSegment_Distance(x0: float, y0: float, x1: float, y1: float, x2: float, y2: float): float {

    // from: https://qiita.com/yellow_73/items/bcd4e150e7caa0210ee6

    var a = x2 - x1;
    var b = y2 - y1;
    var a2 = a * a;
    var b2 = b * b;
    var r2 = a2 + b2;

    if (r2 < 0.000001) {

      return (x0 - x1) * (x0 - x1) + (y0 - y1) * (y0 - y1);
    }

    var tt = -(a * (x1 - x0) + b * (y1 - y0));

    if (tt < 0) {

      return (x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0);
    }

    if (tt > r2) {

      return (x2 - x0) * (x2 - x0) + (y2 - y0) * (y2 - y0);
    }

    var f1 = a * (y1 - y0) - b * (x1 - x0);

    return (f1 * f1) / r2;
  }

  static pointToLine_Distance(P_x: float, P_y: float, A_x: float, A_y: float, B_x: float, B_y: float): float {

    // from: http://www.sousakuba.com/Programming/gs_dot_line_distance.html

    let AB_x = B_x - A_x;
    let AB_y = B_y - A_y;
    let AP_x = P_x - A_x;
    let AP_y = P_y - A_y;

    //ベクトルAB、APの外積の絶対値が平行四辺形Dの面積になる
    let D = Math.abs(AB_x * AP_y - AB_y * AP_x);

    let L = Math.sqrt((B_x - A_x) * (B_x - A_x) + (B_y - A_y) * (B_y - A_y));	//AB間の距離

    let H = D / L;

    return H;
  }

  static pointToLine_NearestPointNormalizedPosition(P_x: float, P_y: float, A_x: float, A_y: float, B_x: float, B_y: float): float {

    // from: http://www.sousakuba.com/Programming/gs_near_pos_on_line.html

    let AB_x = B_x - A_x;
    let AB_y = B_y - A_y;
    let AP_x = P_x - A_x;
    let AP_y = P_y - A_y;

    //ABの単位ベクトルを計算
    let len = Math.sqrt(AB_x * AB_x + AB_y * AB_y);
    if (len <= 0.0) {
      return null;
    }
    let nAB_x = AB_x / len;
    let nAB_y = AB_y / len;

    //Aから線上最近点までの距離（ABベクトルの後ろにあるときはマイナス値）
    let dist_AX = (nAB_x * AP_x + nAB_y * AP_y);

    return dist_AX / len;
  }

  static pointToLine_NearestPoint(result: Vec3, P_x: float, P_y: float, A_x: float, A_y: float, B_x: float, B_y: float): Vec3 {

    // from: http://www.sousakuba.com/Programming/gs_near_pos_on_line.html

    let AB_x = B_x - A_x;
    let AB_y = B_y - A_y;
    let AP_x = P_x - A_x;
    let AP_y = P_y - A_y;

    //ABの単位ベクトルを計算
    let len = Math.sqrt(AB_x * AB_x + AB_y * AB_y);
    if (len <= 0.0) {
      return null;
    }
    let nAB_x = AB_x / len;
    let nAB_y = AB_y / len;

    //Aから線上最近点までの距離（ABベクトルの後ろにあるときはマイナス値）
    let dist_AX = (nAB_x * AP_x + nAB_y * AP_y);

    //線上最近点
    result[0] = A_x + (nAB_x * dist_AX);
    result[1] = A_y + (nAB_y * dist_AX);

    return result;
  }

  static copyTranslation(result: Vec3, matrix: Mat4) {

    result[0] = matrix[12];
    result[1] = matrix[13];
    result[2] = matrix[14];
  }

  static mat4SetVectors(result: Mat4, vecX: Vec3, vecY: Vec3, vecZ: Vec3) {

    result[0] = vecX[0];
    result[1] = vecX[1];
    result[2] = vecX[2];
    result[3] = 0.0;

    result[4] = vecY[0];
    result[5] = vecY[1];
    result[6] = vecY[2];
    result[7] = 0.0;

    result[8] = vecZ[0];
    result[9] = vecZ[1];
    result[10] = vecZ[2];
    result[11] = 0.0;
  }

  static mat4SegmentMat(result: Mat4, resultNormalVec: Vec4, locationFrom: Vec3, locationTo: Vec3) {

    vec3.subtract(resultNormalVec, locationTo, locationFrom);
    vec3.normalize(resultNormalVec, resultNormalVec);

    result[0] = resultNormalVec[0];
    result[1] = resultNormalVec[1];
    result[2] = 0.0;
    result[3] = 0.0;

    result[4] = -resultNormalVec[1];
    result[5] = resultNormalVec[0];
    result[6] = 0.0;
    result[7] = 0.0;

    result[8] = 0.0;
    result[9] = 0.0;
    result[10] = 1.0;
    result[11] = 1.0;

    result[12] = locationFrom[0];
    result[13] = locationFrom[1];
    result[14] = 0.0;
    result[15] = 1.0;
  }

  static getRoundedAngle(angle: float): float {

    if (angle <= -Math.PI) {// TODO: 共通化する
      angle += Math.PI * 2;
    }
    if (angle >= Math.PI) {
      angle -= Math.PI * 2;
    }

    return angle;
  }

}
