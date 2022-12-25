import * as React from 'react'
import { int } from '../common-logics'
import { UI_Icon_MaterialIcon } from '../ui-common-controls'
import { PopoverRef, UI_PopoverContainerAlign, UI_PopoverContainerRef, UI_PopoverContent } from './popover-container'

export interface UI_SelectBoxOption {

  index: int
  label: string
  data?: any
}

export class UI_SelectBoxPopoverRef extends PopoverRef {

  showPopover(
    parentNode: HTMLElement,
    options: UI_SelectBoxOption[],
    values: UI_SelectBoxOption[],
    popoverAlign: UI_PopoverContainerAlign,
    large: boolean,
    onChange?: (value: UI_SelectBoxOption | null) => void
  ){}
}

export interface UI_SelectBoxParam {

  selectBoxPopoverRef: UI_SelectBoxPopoverRef
  options: UI_SelectBoxOption[]
  values: UI_SelectBoxOption[]
  placeholder?: string
  title?: string
  className?: string
  popoberAlign?: UI_PopoverContainerAlign
  border?: boolean
  large?: boolean
  onChange?: (value: UI_SelectBoxOption | null) => void
}

export interface UI_SelectBoxPopoverParam {

  uiRef: UI_SelectBoxPopoverRef
}

export function UI_SelectBox({
  selectBoxPopoverRef,
  options,
  values,
  placeholder = '',
  title = '',
  className = '',
  popoberAlign = UI_PopoverContainerAlign.bottom,
  border = false,
  large = false,
  onChange
}: UI_SelectBoxParam) {

  const popoverParent_Ref = React.useRef<HTMLDivElement>(null)

  function box_Clicked() {

    if (!selectBoxPopoverRef) {
      throw new Error('ERROR 0000:Please provide select box popover ref' + ` for '${title}'`)
    }

    selectBoxPopoverRef.showPopover(popoverParent_Ref.current, options, values, popoberAlign, large, onChange)
  }

  const isSelectionExists = (values.length > 0)

  return (
    <div
      title={title}
      className={`ui-select-box${className ? ' ' + className : ''}${border ? ' button-border' : ''}${large ? ' large' : ''}`}
      ref={popoverParent_Ref}
      onClick={box_Clicked}
    >
      <div className={`ui-select-box-label${!isSelectionExists ? ' placeholder' : ''}`}>{ isSelectionExists ? values[0].label : placeholder }</div>
      <div className='ui-select-box-expand'>
        <UI_Icon_MaterialIcon iconName='expandmore' />
      </div>
    </div>
  )
}

export function UI_SelectBoxPopover({ uiRef }: UI_SelectBoxPopoverParam) {

  const [options, set_options] = React.useState<UI_SelectBoxOption[]>([])
  const [values, set_values] = React.useState<UI_SelectBoxOption[]>([])
  const [large, set_large] = React.useState(false)
  const onChange = React.useRef<(value: UI_SelectBoxOption | null) => void>(null)

  const popoverContentRef = React.useMemo(() => new UI_PopoverContainerRef(), [])

  React.useEffect(() => {

    uiRef.showPopover = (parentNode, new_options, new_values, new_popoverAlign, new_large, new_OnChange) => {

      set_options(new_options)
      set_values(new_values)
      set_large(new_large)
      onChange.current = new_OnChange

      popoverContentRef.show(uiRef, parentNode, new_popoverAlign)
    }

    return function cleanup() {

      uiRef.showPopover = null
    }
  }, [])

  function popover_Exit() {

    popoverContentRef.close(uiRef)
  }

  function option_Clicked(item: UI_SelectBoxOption, e: React.MouseEvent) {

    e.stopPropagation()

    popoverContentRef.close(uiRef)

    if (onChange.current) {

      onChange.current(item)
    }
  }

  return (
    <UI_PopoverContent
      uiRef={popoverContentRef}
      onDissmiss={popover_Exit}
      onEscape={popover_Exit}
    >
      <div className='ui-select-box-popover'
        onClick={(e) => e.stopPropagation()}
      >
        {
          options.map(item => (
            <div key={item.index}
              className={`ui-select-box-list-item ${large ? 'large' : ''} selectable-item ${ values.find(val => val.index == item.index) ? 'selected' : '' }`}
              onClick={(e) => option_Clicked(item, e) }
            >
              <div className='selectable-item-inner'>{item.label}</div>
            </div>
          ))
        }
      </div>
    </UI_PopoverContent>
  )
}
