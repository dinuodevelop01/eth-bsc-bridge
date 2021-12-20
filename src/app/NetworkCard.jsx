import React from "react";
import { styled } from "goober";
import {
  CardContainer,
  Label,
  Flex,
  Body,
} from "@/app/CommonComponents.jsx";
import Button from "@/shared/Button.jsx";
import CaretDown from "@/../www/assets/caret-down.svg";
import Icon from "@/shared/Icon.jsx";
import Dropdown from "@/shared/Dropdown.jsx";


export const NetworkCardContainer = styled("div")`
  flex: 1 1 0%;
`;

export const NetworkContainer = styled("div")`
  display: flex;
  box-sizing: border-box;
  align-items: flex-end;
  justify-content: space-between;
`;

export const ShadowCard = styled(CardContainer)`
  box-shadow: rgb(11 14 17 / 16%) 0px 2px 8px;
  justify-content: space-between;
  height: 124px;
`;

export const NetworkIcon = styled("img")`
  width: 40px;
  height: 40px;
`;

export const DropIcon = styled(Icon)`
  width: 12px;
  height: 12px;
  margin-top: 4px;
`;

function NetworkCard(props) {
  const {
    label,
    defaultValue,
    networks,
    onChange
  } = props;

  const renderButton = (params) => {
    return (
      <Button type="secondary" size="small" {...params}>
        <DropIcon svg={CaretDown}></DropIcon>
      </Button>
    );
  }

  const renderItem = (item) => {
    return item.text;
  };

  const valueItem = networks.find(net => net.value == defaultValue);
  const text = valueItem?.text || "Please choose a network.";

  return (
    <NetworkCardContainer>
      <Label>{label}</Label>
      <ShadowCard className="medium">
        <Flex>
          <NetworkIcon src={valueItem?.icon}></NetworkIcon>
        </Flex>
        <NetworkContainer>
          <Body>{text}</Body>
          <Dropdown
            items={networks}
            defaultValue={defaultValue}
            renderButton={renderButton}
            renderItem={renderItem}
            onChange={(item) => {onChange && onChange(item?.value)}}
          />
        </NetworkContainer>
      </ShadowCard>
    </NetworkCardContainer>
  );
}

export default NetworkCard;
