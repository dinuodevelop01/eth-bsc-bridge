import React from "react";

const Web3Context = React.createContext();

export const Web3Provider = (props) => {
  const [errorMessage, setErrorMessage] = React.useState();
  const [defaultAccount, setDefaultAccount] = React.useState();
  const [userBalance, setUserBalance] = React.useState();
  const [provider, setProvider] = React.useState();

  const value = {
    errorMessage,
    defaultAccount,
    userBalance,
    provider,
    setErrorMessage,
    setDefaultAccount,
    setUserBalance,
    setProvider: (v) => {window._provider = v; setProvider(v);},
  };

  return <Web3Context.Provider value={value}>{props.children}</Web3Context.Provider>
}

export const useWeb3Context = () => {
  const value = React.useContext(Web3Context);

  return value;
}
