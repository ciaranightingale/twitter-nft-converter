import { ChainId, ThirdwebProvider } from "@thirdweb-dev/react";
import { SessionProvider } from "next-auth/react";
import Head from "next/head";
import "../styles/globals.css";

// This is the chainId your dApp will work on.
const activeChainId = ChainId.Goerli;

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <ThirdwebProvider desiredChainId={activeChainId}>
      {/* Next Auth Session Provider*/}
      <SessionProvider session={session}>
        <Head>
          <title>thirdweb Twitter Follower Reward Example</title>
        </Head>
        <Component {...pageProps} />
      </SessionProvider>
    </ThirdwebProvider>
  );
}

export default MyApp;
