import {
  useAddress,
  useDisconnect,
  useMetamask,
  ConnectWallet,
} from "@thirdweb-dev/react";
import { useSession, signIn, signOut } from "next-auth/react";
import React from "react";
import styles from "../styles/Theme.module.css";

export default function SignIn() {
  //Function to allow a user to connect their wallet, connect to twitter if they already have a wallet connected
  const address = useAddress();
  const connectWithMetamask = useMetamask();
  const disconnectWallet = useDisconnect();
  const { data: session } = useSession();

  if (session && address) {
    return (
      <div className={styles.bigSpacerTop}>
        <div className={styles.aTag}>
          <a
            onClick={() => signOut()}
            className={`${styles.mainButton} ${styles.spacerTop}`}
          >
            Sign out of Twitter
          </a>
        </div>
        <div className={styles.aTag}>
          <a
            onClick={() => disconnectWallet()}
            className={`${styles.mainButton} ${styles.spacerTop}`}
          >
            Disconnect wallet
          </a>
        </div>
      </div>
    );
  }

  // 1. Connect with MetaMask
  if (!address) {
    return (
      <div className={styles.main}>
        <h2 className={styles.noGapBottom}>Connect Your Wallet</h2>
        <p>Connect your wallet to check eligibility.</p>
        <ConnectWallet accentColor="#f213a4" colorMode="dark" />
      </div>
    );
  }

  // 2. Connect with Twitter (OAuth)
  if (!session) {
    return (
      <div className={`${styles.main}`}>
        <h2 className={styles.noGapBottom}>Sign In with Twitter</h2>
        <p>
          👋{" "}
          <i>
            Hey,{" "}
            {
              // truncate address
              address.slice(0, 6) + "..." + address.slice(-4)
            }
          </i>
        </p>

        <p>Sign In with Twitter to get your profile picture NFT!</p>

        <button
          className={`${styles.mainButton} ${styles.spacerTop}`}
          onClick={signIn}
        >
          Connect Twitter
        </button>
      </div>
    );
  }
}
