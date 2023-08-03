import React, { useState, useEffect } from 'react';

import './App.css';
import Vote from './components/vote';

type Network = {
  name: string;
  id: string;
};

function App() {
  const [mmInstalled, setMMInstalled] = useState(false);
  const [currentAccount, setCurrentAccount] = useState<any>();
  const [correctNetwork, setCorrectNetwork] = useState(true);

  const { ethereum } = window;

  const targetNetwork: Network = {
    name: process.env.REACT_APP_NETWORK_NAME || "",
    id: process.env.REACT_APP_NETWORK_ID || "",
  };

  const listenMMAccount = async () => {
    if (mmInstalled) {
      ethereum.on("accountsChanged", async function () {
        const accounts = await ethereum.request({ method: "eth_accounts" });
        const account = [...accounts].pop();
        setCurrentAccount(account);
        console.log("found new account : ", account);
      });
    }
  };

  const listenMMNetwork = async () => {
    if (mmInstalled) {
      ethereum.on("networkChanged", function () {
        checkCorrectNetwork();
      });
    }
  };

  const checkIfWalletIsConnected = async () => {
    if (ethereum) {
      setMMInstalled(true);
    } else {
      console.log("No Wallet found. Connect Wallet");
      return;
    }
    const accounts = await ethereum.request({ method: "eth_accounts" });

    if (accounts.length !== 0) {
      console.log("Found authorized Account: ", accounts[0]);
      console.log(process.env.REACT_APP_NETWORK_ID);
      setCurrentAccount(accounts[0]);
      checkCorrectNetwork();
    } else {
      console.log("No authorized account found");
    }
  };

  const checkCorrectNetwork = async () => {
    let chainId = await ethereum.request({ method: "eth_chainId" });
    if (chainId !== targetNetwork.id) {
      setCorrectNetwork(false);
    } else {
      setCorrectNetwork(true);
    }
  };


  useEffect(() => {
    checkIfWalletIsConnected();
    listenMMAccount();
    listenMMNetwork();
  }, [currentAccount]);
  

  return (
      <div>
        <Vote apiEndpoint="/vote"></Vote>
      </div>
  );
}

export default App;
