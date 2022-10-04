import { useAddress } from "@thirdweb-dev/react";
import { useSession, signIn, signOut } from "next-auth/react";
import React from "react";
import styles from "../styles/Theme.module.css";

export default function SignIn() {
  // Allow a user to connect to twitter if they already have a wallet connected
  const address = useAddress();
  const { data: session } = useSession();

  // Disconnect Twitter
  return (
    <>
      {address ? (
        address && session ? (
          <a
            onClick={() => signOut()}
            className={`${styles.mainButton} ${styles.spacerTop}`}
          >
            Sign out of Twitter
          </a>
        ) : (
          // Connect with Twitter (OAuth)
          <>
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
          </>
        )
      ) : (
        <>
          <h2 className={styles.noGapBottom}>Connect Your Wallet</h2>
          <p>Connect your wallet to check eligibility.</p>
        </>
      )}
    </>
  );
}
