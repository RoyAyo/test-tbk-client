import './App.global.css'
import styles from './App.module.css'

import { Navigation } from './components/Navigation'
import { Event } from './components/Events'
import { MetaMaskContextProvider } from './hooks/useMetaMask'

export const App = () => {

  return (
    <MetaMaskContextProvider>
      <div className={styles.appContainer}>
        <Navigation />
        <Event />
      </div>
    </MetaMaskContextProvider>
  )
}