import { useAddress, useContract, Web3Button } from "@thirdweb-dev/react";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import SignIn from "../components/SignIn";
import styles from "../styles/Theme.module.css";
import { contractAddress } from "../constants";

export default function Home() {
  // The currently connected wallet's address
  const address = useAddress();
  // Get the currently authenticated user's session (Next Auth + Twitter)
  const { data: session } = useSession();

  // Get the NFT Collection we deployed using thirdweb+
  const { contract: nftCollectionContract } = useContract(contractAddress);

  // This is simply a client-side check to see if the user is following the twitter page in /api/check-is-in-server
  // We ALSO check on the server-side before providing the signature to mint the NFT in /api/generate-signature
  // This check is to show the user that they are eligible to mint the NFT on the UI.
  //Can use swr with auto refresh enabled to update following status without user reload
  const [data, setData] = useState(null);
  const [isLoading, setLoading] = useState(false);
  useEffect(() => {
    if (session) {
      setLoading(true);
      // Load the check to see if the user is following and store it in state
      fetch("api/check-is-following")
        .then((res) => res.json())
        .then((d) => {
          setData(d || undefined);
          setLoading(false);
        });
    }
  }, [session]);

  // Function to create a signature on the server-side, and use the signature to mint the NFT
  async function mintNft() {
    // Make a request to the API route to generate a signature for us to mint the NFT with
    const signature = await fetch(`/api/generate-signature`, {
      method: "POST",
      body: JSON.stringify({
        // Pass our wallet address (currently connected wallet) as the parameter
        claimerAddress: address,
        data: data,
        session: session,
      }),
    });

    //   // If the user meets the criteria to have a signature generated, we can use the signature
    //   // on the client side to mint the NFT from this client's wallet
    if (signature.status === 200) {
      const json = await signature.json();
      const signedPayload = json.signedPayload;
      const nft = await nftCollectionContract?.signature.mint(signedPayload);

      // Show a link to view the NFT they minted
      alert(
        `Success 🔥 Check out your NFT here: https://testnets.opensea.io/assets/goerli/${contractAddress}/${nft.id.toNumber()}`
      );
    }
    // If the user does not meet the criteria to have a signature generated, we can show them an error
    else {
      alert("Something went wrong. Are you following our Twitter page?");
    }
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.h1}>thirdweb Twitter - NFT Converter Example</h1>

      <p className={styles.explain}>
        An example project demonstrating how you can use{" "}
        <a
          href="https://thirdweb.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.purple}
        >
          thirdweb
        </a>
        &apos;s signature-based minting to reward your community.
      </p>

      <p className={styles.explain}>
        This demo checks if the user is following your Twitter page, and allows
        them to mint an NFT if they are.
      </p>

      <hr className={styles.divider} />

      <SignIn />

      {address && session ? (
        isLoading ? (
          <p>Checking...</p>
        ) : data && data.thirdwebFollower ? (
          <div className={`${styles.main} ${styles.spacerTop}`}>
            <h3>Hey {session?.user?.name} 👋</h3>
            <h4>Thanks for following our Twitter page.</h4>
            <p>Here is a reward for you!</p>

            {/* NFT Preview */}
            <div className={styles.nftPreview}>
              <b>Your NFT:</b>
              <img src={session?.user.image} />
              <p>{session.user.name}&apos;s thirdweb Twitter Follower NFT</p>
            </div>

            <Web3Button
              contractAddress={contractAddress}
              colorMode="dark"
              accentColor="#F213A4"
              action={() => mintNft()}
            >
              Claim NFT
            </Web3Button>
          </div>
        ) : (
          <div className={`${styles.main} ${styles.spacerTop}`}>
            <p>Looks like you are not following our Twitter page.</p>
            <a
              className={styles.mainButton}
              href={`https://twitter.com/thirdweb_`}
            >
              Follow our Twitter Page
            </a>
          </div>
        )
      ) : null}
    </div>
  );
}
