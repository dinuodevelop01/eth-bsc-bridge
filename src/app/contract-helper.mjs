import BridgeEth from "@/contracts/BridgeEth.json";
import BridgeBsc from "@/contracts/BridgeBsc.json";
import TokenEth from "@/contracts/TokenEth.json";
import TokenBsc from "@/contracts/TokenBsc.json";

const validWeb3 = typeof Web3 != "undefined";
const web3Eth = validWeb3 && new Web3(process.env.ETH_HOST);
const web3Bsc = validWeb3 && new Web3(process.env.BSC_HOST);
const adminPrivKey = process.env.PRIV_KEY;
const { address: admin } = validWeb3 && web3Bsc.eth.accounts.wallet.add(adminPrivKey);

const contractsInfo = {
  eth: {
    token: {
      abi: TokenEth.abi,
      address: TokenEth.networks['4']?.address,
    },
    bridge: {
      abi: BridgeEth.abi,
      address: BridgeEth.networks['4']?.address,
    },
    provider: web3Eth,
  },

  bsc: {
    token: {
      abi: TokenBsc.abi,
      address: TokenBsc.networks['97']?.address,
    },
    bridge: {
      abi: BridgeBsc.abi,
      address: BridgeBsc.networks['97']?.address,
    },
    provider: web3Bsc,
  }
}

const hashedContracts = {};

const createContract = (contractName, tokenType, signed) => {
  const contractInfo = contractsInfo[contractName][tokenType];
  if (signed) {
    const contract = new window._provider.eth.Contract(
      contractInfo.abi,
      contractInfo.address
    );

    // hashedContracts[`${contractName}_${tokenType}_${signed}`] = contract;
    return contract;
  }
  else {
    const hashedContract = hashedContracts[`${contractName}_${tokenType}_${signed}`];
    if (hashedContract) return hashedContract;
    
    const contract = new contractsInfo[contractName].provider.eth.Contract(
      contractInfo.abi,
      contractInfo.address
    );

    hashedContracts[`${contractName}_${tokenType}_${signed}`] = contract;
    return contract;
  }
}

export const listen = (fromContractName, toContractName, done) => {
  const provider = window._provider;
  if (!provider) {
    return;
  }

  const bridgeFromSigned = createContract(fromContractName, "bridge", true);
  const bridgeTo = createContract(toContractName, "bridge", false);
  const providerTo = contractsInfo[toContractName].provider;

  bridgeFromSigned.events.Transfer(
    {fromBlock: 0, step: 0}
  )
  .on('data', async event => {
    const { from, to, amount, date, nonce, signature } = event.returnValues;
  
    const tx = bridgeTo.methods.mint(from, to, amount, nonce, signature);
    const [gasPrice, gasCost] = await Promise.all([
      providerTo.eth.getGasPrice(),
      tx.estimateGas({from: admin}),
    ]);
    const data = tx.encodeABI();
    const txData = {
      from: admin,
      to: bridgeTo.options.address,
      data,
      gas: gasCost,
      gasPrice
    };
    const receipt = await providerTo.eth.sendTransaction(txData);
    console.log(`Transaction hash: ${receipt.transactionHash}`);
    console.log(`
      Processed transfer:
      - from ${from} 
      - to ${to} 
      - amount ${amount} tokens
      - date ${date}
      - nonce ${nonce}
    `);
    done();
  });
}

export const transfer = async (fromContractName, toContractName, amount, done) => {
  const provider = window._provider;
  if (provider) {
    const nonce = parseInt(Math.random()*100000);
    const accounts = await provider.eth.getAccounts();
    const amount = 1;
    const message = provider.utils.soliditySha3(
      {t: 'address', v: accounts[0]},
      {t: 'address', v: accounts[0]},
      {t: 'uint256', v: amount},
      {t: 'uint256', v: nonce},
    ).toString('hex');
    const { signature } = provider.eth.accounts.sign(
      message, 
      adminPrivKey
    );

    const bridgeFromSigned = createContract(fromContractName, "bridge", true);
    const burn = await bridgeFromSigned.methods.burn(accounts[0], amount, nonce, signature);

    burn.send({from: accounts[0]})
    .on("receipt", (receipt) => {
      console.log("receipt--", receipt);
      done();
    })
    .on("error", (err) => {
      console.log("error---", err);
      done();
    });
  }
}

export const getEthTokenBalance = async (done) => {
  const provider = window._provider;
  if (provider) {
    const tokenEth = createContract("eth", "token", false);
    const [sender, _] = await provider.eth.getAccounts();
    const balanceOf = await tokenEth.methods.balanceOf(sender);
    const balance = await balanceOf.call();
    done && done(balance);
  }
  
}

export const getBscTokenBalance = async (done) => {
  const provider = window._provider;
  if (provider) {
    const tokenBsc = createContract("bsc", "token", false);
    const [recipient, _] = await provider.eth.getAccounts();
    const balanceOf = await tokenBsc.methods.balanceOf(recipient);
    const balance = await balanceOf.call();
    done && done(balance);
  }
}