import * as React from 'react';
import { UI_Icon_MaterialIcon } from './icon-material-icon';

export interface UI_CheckBoxRefParam {

  trueValue?: boolean | number | null;
  falseValue?: boolean | number | null;
  value?: boolean | number | null;
  onChange?(checked: boolean, value: boolean | number | null): void;
}

export function UI_CheckBox({ trueValue = true, falseValue = false, value = false, onChange = null }: UI_CheckBoxRefParam) {

  function box_Clicked() {

    if (onChange) {

      const new_checked = !(value == trueValue);
      onChange(new_checked, new_checked ? trueValue : falseValue);
    }
  }

  return (
    <div className="ui-checkbox-container selectable-item" onPointerDown={box_Clicked}>
      <div className="content">
        <UI_Icon_MaterialIcon iconName={value == trueValue ? "check" : ""} />
      </div>
    </div>
  );
}
