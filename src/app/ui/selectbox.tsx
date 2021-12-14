import styled from '@emotion/styled';
import Select from 'react-dropdown-select';

export interface UI_SelectBoxOption {

  value: string;
  label: string;
  data?: any;
}

export const UI_SelectBox = styled(Select)`

  background: #fff;
  border-color: #888 !important;
  color: #000;
  font-size: 14px;
  min-height: 32px;

  :focus, :focus-within {
    outline: none;
    box-shadow: unset;
  }

  .react-dropdown-select-clear,
  .react-dropdown-select-dropdown-handle {
    color: #000;
  }

  .react-dropdown-select-option {
    border: 1px solid #000;
  }

  .react-dropdown-select-item {
    color: #000;
  }

  .react-dropdown-select-input {
    color: #000;
    width: 50px;
  }

  .react-dropdown-select-dropdown {
    position: absolute;
    left: 0;
    border: 1px solid #888;
    width: 200px;
    padding: 0;
    display: flex;
    flex-direction: column;
    border-radius: 2px;
    max-height: 300px;
    overflow: auto;
    z-index: 9;
    background: #fff;
    box-shadow: none;
    color: #000 !important;
  }

  .react-dropdown-select-item {
    color: #000;
    border-bottom: 1px solid #fff;

    :hover {
      color: #000;
      background: #e0e0ff;
    }
  }

  .react-dropdown-select-item.react-dropdown-select-item-selected,
  .react-dropdown-select-item.react-dropdown-select-item-active {
    background: #ddf;
    border-bottom: 1px solid #fff;
    color: #000;
    font-weight: bold;
  }

  .react-dropdown-select-item.react-dropdown-select-item-disabled {
    background: #777;
    color: #ccc;
  }
`;
