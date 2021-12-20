import React from "react";
import { styled } from "goober";
import {
  Label,
} from "@/app/CommonComponents.jsx";

export const InputContainer = styled("div")`
  flex: 1 1 0%;
`;

export const StyledInput = styled("input")`
  height: 78px;
  width: 100%;
  padding: 12px 20px;
  box-sizing: border-box;
  border: 1px solid var(--blue);
  border-radius: 8px;
  background-color: var(--bg-secondary);
  font-size: var(--fs-large);
  line-height: 68px;
  padding-left: 12px;
  padding-right: 12px;

  &:focus {
    outline: none !important;
    border: 1px solid var(--primary);
  }

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
`;

function Input(props) {
  const { label, className, value, onChange } = props;

  return (
    <InputContainer className={className}>
      <Label>{label}</Label>
      <StyledInput type="number" value={value} onChange={e => onChange && onChange(e.target.value)}/>
    </InputContainer>
  );
}

export default Input;
