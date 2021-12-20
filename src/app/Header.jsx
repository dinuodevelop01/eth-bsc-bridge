import React, { useEffect, useState } from "react";
import { styled } from "goober";
import { useWeb3Context } from "@/app/Web3Provider.jsx";
import Button from "@/shared/Button.jsx";

export const Container = styled("div")`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary);
  padding: 12px 24px;
  width: 100%;
  box-sizing: border-box;
`;

export const RightSection = styled("div")`
  margin-left: auto;
`;

function Header() {
  const {
    defaultAccount,
    setDefaultAccount,
    setProvider,
    setErrorMessage,
  } = useWeb3Context();
  const [buttonText, setButtonText] = useState("Connect To Metamask");

	const connectMetamask = () => {
		if (window.ethereum && defaultAccount == null) {
      const provider = new Web3(window.ethereum);
			setProvider(provider);

			// connect to metamask
			window.ethereum.request({ method: 'eth_requestAccounts'})
			.then(result => {
				setDefaultAccount(result[0]);
        setButtonText("Connected to Metamask");
			})
			.catch(error => {
				setErrorMessage(error.message);
			});

		} else if (!window.ethereum){
			console.log('Need to install MetaMask');
			setErrorMessage('Please install MetaMask browser extension to interact');
		}
	}

  return (
    <Container>
      <RightSection>
        <Button onClick={connectMetamask} disabled={defaultAccount ? true : false}>{buttonText}</Button>
      </RightSection>
    </Container>
  );
}

export default Header;
