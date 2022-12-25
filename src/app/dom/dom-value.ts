import { ColorLogic, float, int, Strings } from "../common-logics"

// TODO: もっといい名前にする
export class DOMValueLogic {

  getElement(id: string): HTMLElement {

    const element = document.getElementById(id)

    if (element == null) {
      throw new Error('ERROR 0051:Could not find element "' + id + '"')
    }

    return element
  }

  setElementText(id: string, text: string): HTMLElement {

    const element = <HTMLInputElement>(document.getElementById(id))

    element.innerText = text

    return element
  }

  setInputElementText(id: string, text: string): HTMLElement {

    const element = <HTMLInputElement>(document.getElementById(id))

    element.value = text

    return element
  }

  getInputElementText(id: string): string {

    const element = <HTMLInputElement>(document.getElementById(id))

    return element.value
  }

  setInputElementNumber(id: string, value: float): HTMLElement {

    const element = <HTMLInputElement>(document.getElementById(id))

    element.value = value.toString()

    return element
  }

  setInputElementNumber2Decimal(id: string, value: float): HTMLElement {

    const element = <HTMLInputElement>(document.getElementById(id))

    element.value = value.toFixed(2)

    return element
  }

  getInputElementNumber(id: string, defaultValue: float): float {

    const element = <HTMLInputElement>(document.getElementById(id))

    if (element.value == '') {

      return defaultValue
    }

    return Number(element.value)
  }

  setInputElementRangeValue(id: string, value: float, max: float): HTMLElement {

    const element = <HTMLInputElement>(document.getElementById(id))

    element.value = (value / max * Number(element.max)).toString()

    return element
  }

  getInputElementRangeValue(id: string, max: int, defaultValue: float): float {

    const element = <HTMLInputElement>(document.getElementById(id))

    if (Strings.isNullOrEmpty(element.value)) {

      return defaultValue
    }

    const value = Number(element.value) / Number(element.max) * max

    return value
  }

  setRadioElementIntValue(elementName: string, value: int) {

    const valueText = value.toString()

    const elements = document.getElementsByName(elementName)

    for (let i = 0; i < elements.length; i++) {
      const radio = <HTMLInputElement>elements[i]

      radio.checked = (radio.value == valueText)
    }
  }

  getRadioElementIntValue(elementName: string, defaultValue: int): int {

    let value = defaultValue

    const elements = document.getElementsByName(elementName)

    for (let i = 0; i < elements.length; i++) {
      const radio = <HTMLInputElement>elements[i]

      if (radio.checked) {

        value = Number(radio.value)
      }
    }

    return value
  }

  setInputElementBoolean(id: string, checked: boolean) {

    const element = <HTMLInputElement>(document.getElementById(id))

    element.checked = checked
  }

  getInputElementBoolean(id: string): boolean {

    const element = <HTMLInputElement>(document.getElementById(id))

    return element.checked
  }

  setInputElementColor(id: string, color: Vec4): Vec4 {

    const colorText = '#' + ColorLogic.rgbToHex2String(color)

    const element = <HTMLInputElement>(document.getElementById(id))

    element.value = colorText

    return color
  }

  getInputElementColor(id: string, result: Vec4): Vec4 {

    const element = <HTMLInputElement>(document.getElementById(id))

    const colorText = element.value

    ColorLogic.hex2StringToRGB(result, colorText)

    return result
  }

  getInputElementFilePath(id: string): string {

    const element = <HTMLInputElement>(document.getElementById(id))

    if (element.files.length == 0) {

      return null
    }

    const file = element.files[0]

    return file['path']
  }

  setColorMixerValue(id: string, colorValue: float, colorMixer_id_number: string, colorMixer_id_range: string) {

    this.setInputElementNumber2Decimal(id + colorMixer_id_number, colorValue)
    this.setInputElementRangeValue(id + colorMixer_id_range, colorValue, 1.0)
  }
}
