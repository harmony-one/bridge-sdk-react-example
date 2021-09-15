import React, { useEffect, useState } from 'react'
import detectEthereumProvider from '@metamask/detect-provider'
import { BridgeSDK, TOKEN, EXCHANGE_MODE, STATUS, NETWORK_TYPE } from 'bridge-sdk'
import * as configs from 'bridge-sdk/lib/configs';

const App = () => {
  const [metamaskAddress, setMetamaskAddress] = useState()

  useEffect(() => {
    detectEthereumProvider().then((provider) => {
      try {
        // @ts-ignore
        if (provider !== window.ethereum) {
          console.error('Do you have multiple wallets installed?')
        }

        if (!provider) {
          alert('Metamask not found')
        }

        provider.on('accountsChanged', (accounts) =>
            setMetamaskAddress(accounts[0])
        )

        provider.on('disconnect', () => {
            setMetamaskAddress('')
        })

        provider
            .request({ method: 'eth_requestAccounts' })
            .then(async (accounts) => {
                setMetamaskAddress(accounts[0])
            })
      } catch (e) {
        console.error(e)
      }
    })
  }, [])

  const sendTokens = async () => {
      const bridgeSDK = new BridgeSDK({ logLevel: 3 }); // 2 - full logs, 1 - only success & errors, 0 - logs off

      await bridgeSDK.init({ ...configs.mainnet, sdk: 'web3' });

      await bridgeSDK.setUseMetamask(true);
      await bridgeSDK.setUseOneWallet(true);

      let operationId;

      // display operation status
      let intervalId = setInterval(async () => {
          if (operationId) {
              const operation = await bridgeSDK.api.getOperation(operationId);

              console.log(operation.status);
              console.log(
                'Action: ',
                operation.actions.filter(a => a.status === STATUS.IN_PROGRESS)
              );

              if (operation.status !== STATUS.IN_PROGRESS) {
                  clearInterval(intervalId);
              }
          }
      }, 4000);

      try {
          await bridgeSDK.sendToken(
              {
                  type: EXCHANGE_MODE.ONE_TO_ETH,
                  network: NETWORK_TYPE.BINANCE,
                  token: TOKEN.ERC20,
                  erc20Address: "0x0aB43550A6915F9f67d0c454C2E90385E6497EaA", //bscBUSD //bscADA gets same result
                  amount: "0.0001",
                  ethAddress: metamaskAddress,
                  oneAddress: metamaskAddress,
               },
              id => (operationId = id)
          );
      } catch (e) {
          console.error(e);
      }
  }

  return (
      <div
          style={{
            background: '#dedede',
            width: '100vw',
            height: '100vh',
            padding: '100px 0'
          }}
      >
        <div
            style={{
              maxWidth: 600,
              margin: '0 auto'
            }}
        >
            Your metamask address: {metamaskAddress}
            <button onClick={() => sendTokens()}>Send tokens</button>
        </div>
      </div>
  )
}

export default App
