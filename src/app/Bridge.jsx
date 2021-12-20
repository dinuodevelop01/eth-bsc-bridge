import React, { useState, useEffect } from "react";
import { styled } from "goober";
import { useSnapshot } from "valtio";
import { readState } from "@/__main__/app-state.mjs";
import { useWeb3Context } from '@/app/Web3Provider.jsx';
import {
  CardContainer,
  Label,
} from "@/app/CommonComponents.jsx";
import Header from "@/app/Header.jsx";
import Button from "@/shared/Button.jsx";
import Input from "@/app/Input.jsx";
import NetworkCard from "@/app/NetworkCard.jsx";
import ArrowRight from "@/../www/assets/arrow-right.svg";
import Icon from "@/shared/Icon.jsx";
import { setFrom, setTo } from "@/app/actions.mjs";
import { NETWORKS } from "@/app/constants.mjs";
import { 
  transfer,
  listen,
  getEthTokenBalance,
  getBscTokenBalance
} from "@/app/contract-helper.mjs";

export const Container = styled("div")`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const Content = styled("div")`
  margin-top: 40px;
  width: 556px;
`;

export const BridgeContainer = styled("div")`
  display: flex;
  justify-content: space-between;
  -webkit-box-pack: justify;
`;

export const ArrowIcon = styled(Icon)`
  width: 14px;
  height: 14px;
  margin-top: 4px;
`;

function Bridge() {
  const state = useSnapshot(readState);
  const { provider, defaultAccount } = useWeb3Context();
  const [ amount, setAmount ] = useState(0);
  const [ ethBalance, setEthBalance ] = useState();
  const [ bscBalance, setBscBalance ] = useState();
  const [ isTransferring, setIsTransferring ] = useState(false);

  const from = state.bridge.from;
  const to = state.bridge.to;
  const fromNetworks = NETWORKS.map(net => ({
    ...net,
    active: net.value == to ? false : net.active
  }));
  const toNetworks = NETWORKS.map(net => ({
    ...net,
    active: net.value == from ? false : net.active
  }));

  const swapBridge = () => {
    setFrom(to);
    setTo(from);
  }

  const startTransfer = () => {
    if (provider && defaultAccount && amount && !isTransferring) {
      setIsTransferring(true);
      
      transfer(from, to, amount, () => {
        listen(from, to, () => {
          invalidateBalances();
        });
        setIsTransferring(false);
      });
    }
  }

  const invalidateBalances = () => {
    if (provider && defaultAccount) {
      getEthTokenBalance((balance) => {
        setEthBalance(balance);
      });
      getBscTokenBalance((balance) => {
        setBscBalance(balance);
      });
    }
  }

  useEffect(() => {
    invalidateBalances();
  }, [provider, defaultAccount]);

  return (
    <Container>
      <Header/>
      <Content>
        <CardContainer className="large">
          <BridgeContainer>
            {/* From */}
            <NetworkCard 
              label="From" 
              defaultValue={from} 
              networks={fromNetworks}
              onChange={(v) => setFrom(v)}
            />

            {/* Switch Button */}
            <Button type="secondary" className="mbt-auto mx-medium" onClick={swapBridge}>
              <ArrowIcon svg={ArrowRight}></ArrowIcon>
            </Button>

            {/* To */}
            <NetworkCard 
              label="To"
              defaultValue={to} 
              networks={toNetworks}
              onChange={(v) => setTo(v)}
            />
          </BridgeContainer>

          <Input label="Amount" className="mt-medium" value={amount} onChange={setAmount}></Input>

          {from == "eth" && (
            <>
              <Label className="mt-small">eth balance: {ethBalance}</Label>
              <Label className="mt-small">bsc balance: {bscBalance}</Label>
            </>
          )}
          
          {from == "bsc" && (
            <>
              <Label className="mt-small">bsc balance: {bscBalance}</Label>
              <Label className="mt-small">eth balance: {ethBalance}</Label>
            </>
          )}

          <Button 
            type="primary" 
            className="mt-medium" 
            onClick={startTransfer}
            disabled={(!defaultAccount || isTransferring || !amount)}
          >
            {isTransferring ? "Transferring..." : "Confirm"}
          </Button>
        </CardContainer>
      </Content>
    </Container>
  );
}

export default Bridge;
