import * as React from 'react';

export interface UI_CheckBoxRefParam {

  trueValue?: boolean | number | null;
  falseValue?: boolean | number | null;
  value?: boolean | number | null;
  onChange?(checked: boolean, value: boolean | number | null): void;
}

export function UI_CheckBox({ trueValue = true, falseValue = false, value = false, onChange = null }: UI_CheckBoxRefParam) {

  function handleClick() {

    if (onChange) {

      const new_checked = !(value == trueValue);
      onChange(new_checked, new_checked ? trueValue : falseValue);
    }
  }

  return (
    <div className="ui-checkbox-container selectable-item" onClick={handleClick}>
      <div className="content">
        <i className='material-icons'>{value == trueValue ? "check" : ""}</i>
      </div>
    </div>
  );
}
