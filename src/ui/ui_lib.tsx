import * as React from 'react';
import { float } from '../base/conversion';

export class UILib {

  static getInputElementNumber(element: HTMLInputElement, defaultValue: float): float {

    if (element.value == '') {

      return defaultValue;
    }

    return Number(element.value);
  }
}
