import { int, float } from '../common-logics';
import * as React from 'react';

export interface UI_RibbonUI_NumberInputParam {

  digit?: int
  step?: float
  min?: float
  max?: float
  value: float
  onChange?(value: float): void
}

export function UI_NumberInput({ digit = 2, step = 0.05, min = 0.0, max = 100, value, onChange }: UI_RibbonUI_NumberInputParam) {

  let valueText = ''
  if (typeof(value) == 'number') {

    valueText = value.toFixed(digit)
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {

    let inputValue = Number(event.target.value)

    if (isNaN(inputValue)) {

      inputValue = null
    }
    else {

      if (inputValue < min) {

        inputValue = min
      }

      if (inputValue > max) {

        inputValue = max
      }
    }

    if (onChange) {

      onChange(inputValue)
    }
  }

  return (
    <input className="number-input" type="number" step={step.toString()} value={valueText} onChange={handleChange} />
  )
}
