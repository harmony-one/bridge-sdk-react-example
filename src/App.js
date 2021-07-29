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
      const bridgeSDK = new BridgeSDK({ logLevel: 2 }); // 2 - full logs, 1 - only success & errors, 0 - logs off

      await bridgeSDK.init(configs.testnet);

      await bridgeSDK.setUseMetamask(true);

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
                  type: EXCHANGE_MODE.ETH_TO_ONE,
                  network: NETWORK_TYPE.ETHEREUM,
                  token: TOKEN.BUSD,
                  amount: 2,
                  ethAddress: metamaskAddress,
                  oneAddress: 'one1we0fmuz9wdncqljwkpgj79k49cp4jrt5hpy49j',
              },
              id => (operationId = id)
          );
      } catch (e) {
          console.log('Error: ', e.message);
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
