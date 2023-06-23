/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, createContext, PropsWithChildren, useContext, useCallback } from 'react'

import detectEthereumProvider from '@metamask/detect-provider'
import { ethers } from 'ethers'

interface WalletState {
  accounts: any[]
}

interface MetaMaskContextData {
  wallet: WalletState
  hasProvider: boolean | null
  error: boolean
  errorMessage: string
  isConnecting: boolean
  connectMetaMask: () => void
  clearError: () => void
}

const disconnectedState: WalletState = { accounts: [] }

const MetaMaskContext = createContext<MetaMaskContextData>({} as MetaMaskContextData)

export const MetaMaskContextProvider = ({ children }: PropsWithChildren) => {
  const [hasProvider, setHasProvider] = useState<boolean | null>(null)

  const [isConnecting, setIsConnecting] = useState(false)

  const [errorMessage, setErrorMessage] = useState('')
  const clearError = () => setErrorMessage('')

  const [wallet, setWallet] = useState(disconnectedState)
  // useCallback ensures that we don't uselessly re-create the _updateWallet function on every render
  const _updateWallet = useCallback(async (providedAccounts?: any) => {
    const accounts = providedAccounts || await window.ethereum.request(
      { method: 'eth_accounts' },
    )

    if (accounts.length === 0) {
      // If there are no accounts, then the user is disconnected
      setWallet(disconnectedState)
      return
    }

    setWallet({ accounts })

    const isWhitedListed = authenticate(accounts[0])
    
    if(!isWhitedListed) {
      await connectSmartContract(accounts[0])
    }

  }, [])

  
  const updateWalletAndAccounts = useCallback(() => _updateWallet(), [_updateWallet])
  const updateWallet = useCallback((accounts: any) => {
    console.log(10)
    localStorage.clear()
    _updateWallet(accounts)
  }, [_updateWallet])

  useEffect(() => {
    const getProvider = async () => {
      const provider = await detectEthereumProvider({ silent: true })
      setHasProvider(Boolean(provider))

      if (provider) {
        updateWalletAndAccounts()
        window.ethereum.on('accountsChanged', updateWallet)
      }
    }

    getProvider()

    return () => {
      window.ethereum?.removeListener('accountsChanged', updateWallet)
    }
  }, [updateWallet, updateWalletAndAccounts])

  const connectMetaMask = async () => {
    setIsConnecting(true)

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      })
      clearError()
      updateWallet(accounts)
    } catch(err: any) {
      setErrorMessage(err.message)
    }
    setIsConnecting(false)
  }

  return (
    <MetaMaskContext.Provider
      value={{
        wallet,
        hasProvider,
        error: !!errorMessage,
        errorMessage,
        isConnecting,
        connectMetaMask,
        clearError,
      }}
    >
      {children}
    </MetaMaskContext.Provider>
  )
}

export const useMetaMask = () => {
  const context = useContext(MetaMaskContext)
  if (context === undefined) {
    throw new Error('useMetaMask must be used within a "MetaMaskContextProvider"')
  }
  return context
}

const connectSmartContract = async (account: string) => {
  const provider = new ethers.BrowserProvider(window.ethereum)
  const signer = await provider.getSigner()
  const address = '0xff2d3a2e4dd161dd2feb91e605e570c85330fd5a'
  const abi = [{ 'inputs':[],'stateMutability':'nonpayable','type':'constructor' },{ 'inputs':[],'name':'AlreadyWhitelisted','type':'error' },{ 'inputs':[],'name':'NotOwner','type':'error' },{ 'inputs':[],'name':'ZeroAddress','type':'error' },{ 'anonymous':false,'inputs':[{ 'indexed':false,'internalType':'address','name':'whitelistedAddress','type':'address' }],'name':'Whitelisted','type':'event' },{ 'inputs':[{ 'internalType':'address','name':'walletAddress','type':'address' }],'name':'whitelist','outputs':[],'stateMutability':'nonpayable','type':'function' },{ 'inputs':[{ 'internalType':'address','name':'walletAddress','type':'address' }],'name':'whitelisting','outputs':[{ 'internalType':'bool','name':'isWhitelisted','type':'bool' }],'stateMutability':'view','type':'function' }]

  try {
    const myContractWrite = new ethers.Contract(address, abi, signer)
  
    const result = await myContractWrite.whitelist(account)
    console.log('result =>', result)

    await registerWhitelist()
  } catch (error: any) {
    console.error(error)
    alert(error.message)
  }
}

const signMessage = async (nonce: string) => {
  const provider = new ethers.BrowserProvider(window.ethereum)
  const signer = await provider.getSigner()
  
  const signature = await signer.signMessage(nonce)
  const address = await signer.getAddress()
  return {
    signature,
    address,
  }
}

const registerWhitelist = async () => {
  const result = await fetch('http://3.89.157.115:3000/api/v1/users/is-whitelisted', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('_token')}`,
    },
  })
  const data = await result.json()
  if(data.error) {
    alert(data.message)
  } else {
    alert('User whitelisted')
  }
}
const registeruserToGetNonce = async (walletAddress: string) => {
  const result = await fetch('http://3.89.157.115:3000/api/v1/users/register', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      walletAddress,
    }),
  })
  const data = await result.json()
  if(data.error) {
    alert(data.message)
  } else {
    return data.data
  }
}

export const authenticate = async (wallet: string) => {
  // check if token is still in available
  const expiresIn = Number(localStorage.getItem('expiresIn'))
  const currentTime = Math.floor(new Date().getTime()/1000.0)

  if( currentTime > expiresIn) {
    const {
      nonce,
      isWhitelisted,
    }= await registeruserToGetNonce(wallet)
    console.log(nonce)

    const {
      signature,
      address,
    } = await signMessage(nonce)

    await fetchToken(address, signature)
    return isWhitelisted
  }
  return true
}

const fetchToken = async (walletAddress: string, signature?: string) => {
  const result = await fetch('http://3.89.157.115:3000/api/v1/users/get-token', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      walletAddress,
      signature,
    }),
  })
  const data = await result.json()
  if(data.error) {
    alert(data.message)
  } else {
    const createdAt = Math.floor(new Date().getTime()/1000.0) - 50 //Substracting 50seconds from expiry time
    // expires in 2 hours
    const expiresIn = 7200
    const expiryTimestamp = String(expiresIn + createdAt)
    localStorage.setItem('_token', data.data._token)
    localStorage.setItem('expiresIn', expiryTimestamp)
  }
}
