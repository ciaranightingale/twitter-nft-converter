# thirdweb Twitter Follower NFT Example

In this example, we will utilize [signature-based minting](https://portal.thirdweb.com/advanced-features/on-demand-minting) of NFTs and adapt the existing [community rewards](https://github.com/thirdweb-example/community-rewards) example to create a web-page which connects users with their Twitter account and generates a signature to mint an NFT to their wallet if they a thirdweb Twitter **follower**.

This example shows you how to:

- Connect users to their Twitter account using [NextAuth](https://next-auth.js.org/)
- Generate signatures to mint an NFT to the users wallet
- Check if the user is a Twitter follower

Checkout this example [here](https://twitter-nft-converter.vercel.app/)

If you're interested in reading the basics of signature-based minting, we recommend starting with [this](https://github.com/thirdweb-example/signature-based-minting-next-ts) example repository

## Using This Repo

- Create an NFT Collection contract via the thirdweb dashboard on the **Goerli** test network.

- Create a project using this example by forking the repo.

- Find and replace our demo NFT Collection address (`0x25859732c176861c28b6b454C66FFE5bb2672Eb9`) in this repository, inside the [utils/constants.js](utils/constants.js) file with your NFT Collection contract address from the dashboard.

- We use the thirdweb Twitter profile ID `1382854043433783296`. Find and replace this ID with your own Twitter profile ID inside the [utils/constants.js](utils/constants.js) file. You can learn how to get your Twitter from [this guide](https://www.wikihow.com/Find-Your-User-ID-on-Twitter).

```bash
npm install
# or
yarn install
```

- Run the development server:

```bash
npm run start
# or
yarn start
```

- Visit http://localhost:3000/ to view the demo.

## Introduction

This application follows the same structure as the [community rewards](https://github.com/thirdweb-example/community-rewards) example repository so for a step-by-step guide, follow [this](https://github.com/thirdweb-example/community-rewards) guide.

The flow of this example is:

1. User connects their wallet to the application
2. User authenticates/signs in with Twitter
3. Server checks if the user is a Twitter follower
4. If the user is a follower, allow user to attempt to mint an NFT
5. Generate signature for the user's wallet if they are following
6. The server sends the signature to the client
7. The client uses the signature to mint an NFT into their wallet

## Connecting Wallet

We have a Connect Wallet UI component that handles the sign in logic for connecting a wallet, see documentation [here](https://portal.thirdweb.com/react/react.connectwallet).

We have built a component that handles the sign in logic for Twitter in [/components/SignIn.js](/components/SignIn.js).

```jsx
import const ConnectWallet from "@thirdweb-dev/react";

// Use this component anywhere within your app
<ConnectWallet accentColor="#f213a4" colorMode="dark" margin={"1rem"} />
```

```jsx
// This is the chainId your dApp will work on.
const activeChainId = ChainId.Goerli;

function MyApp({ Component, pageProps }) {
  return (
    <ThirdwebProvider desiredChainId={activeChainId}>
      {/* Next Auth Session Provider */}
      <SessionProvider session={pageProps.session}>
        <Component {...pageProps} />
      </SessionProvider>
    </ThirdwebProvider>
  );
}
```

## Connecting with Twitter

We are using the Authentication library [NextAuth.js](https://next-auth.js.org/) to authenticate users with their Twitter accounts.

`NextAuth` uses the [`pages/api/auth/[...nextauth].js`](./pages/api/auth/[...nextauth].js) file to handle the authentication logic such as redirects for us.

We setup the Twitter Provider and pass in our Twitter applications information that we got from the Twitter Developer Portal (discussed below).

```jsx
  providers: [
    TwitterProvider({
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      version: "2.0",
      authorization: {
        params: {
          scope: "follows.read users.read tweet.read",
        },
    }),
  ],
```

As you can see, we are also requesting additional scopes on the user's profile: `follows.read users.read tweet.read`.

This is so that we can later make another API request to access a list accounts the user is following.

We are using version OAuth 2.0.

### Setting Up Your Twitter Application

Head to the [Twitter Developer portal](https://developer.twitter.com/en/portal/dashboard) and create a new application.

Inside the user authetication settings, set:

- The App Permissions to `read & write`
- The type of app to `Web App, Automated App or Bot`
- The callback uri / Redirect url to your deployment domain
- The website url, terms of service and privacy policy to `https://thirdweb.com`

Copy your client ID and client secret. We need to store these as environment variables in our project so that we can use them on the API routes in our application.

Create a file at the root of your project called `.env.local` and add the following lines:

```bash
CLIENT_ID=<your-twitter-client-id-here>
CLIENT_SECRET=<your-twitter-client-secret-here>
```

In the `SignIn` component, we are importing functions from `next-auth/react` to sign in and out with Twitter.

```jsx
import { useSession, signIn, signOut } from "next-auth/react";
```

When user is signed in, we can access their session information using the `useSession` hook:

```jsx
const { data: session } = useSession();
```

One final detail on the Twitter connection is that we have some custom logic to append the `accessToken` & `userID` to the `session`, so that we can use this to make further API requests. i.e. we need the user's access token & id to provide to the `Authorization Bearer` & request url respectively when we make the API request to see which accounts this user is following.

```jsx
// Inside [...nextauth.js]

// When the user signs in, get their token
  callbacks: {
    async jwt({ token, account, user }) {
      // Add the user ID to the token user data
      if (user) {
        token["user"] = {
          userId: user.id,
        };
      }
      // Add the OAuth access_token to the token right after signin
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
  }
```

Now when we call `useSession` or `getSession`, we have access to the `accessToken` & `id` of the user; which allows us to make further requests to the Twitter API.

For more information on the Twitter API visit the [docs](https://developer.twitter.com/en/docs/twitter-api)

## Checking Accounts User is Following

Before the user sees the mint button, we make a check to see if the user is following on Twitter, using Next.js API Routes.

This logic is performed on the [pages/api/check-is-following.js](./pages/api/check-is-following.js) file.

First, we get the user's accessToken from the session.

We use this accessToken to request who the user is following.

```jsx
// Get the Next Auth session so we can use the accessToken as part of the Twitter API request
const session = await unstable_getServerSession(req, res, authOptions);
// Read the access token from the session
const accessToken = session?.accessToken;

// Get the user's ID from the session
// Make a request to the Twitter API to get the users following
const userId = session.user.id;
const url = `https://api.twitter.com/2/users/${userId}/following`;
const token = `BEARER ${accessToken}`;
let headers = new Headers();
headers.append("Authorization", token);
const options = {
  method: "GET",
  headers: headers,
};
const response = await fetch(url, options);

// You may get rate limited here and receive an error.

// Parse the response as JSON
const data = await response.json();
```

Now we have a list of the the user is following inside the `data` variable. We can filter the array of accounts to find the one we are looking for:

```jsx
// Filter all the followers to find the one we want
// Returns undefined if the user is not a follower
// Returns the follower object if the user is a follower
const thirdwebTwitterFollower = data?.data.find(
  (user) => user.id === twitterId
);

// Return undefined or the server object to the client.
res
  .status(200)
  .json({ thirdwebFollower: thirdwebTwitterFollower ?? undefined });
```

We then make a `fetch` request on the client to this API route on the [index.js](./pages/index.js) file:

```jsx
// This is a server-side check to see if the user is following the twitter page in /api/check-is-following
// This check is to show the user that they are eligible to mint the NFT on the UI and used to generate the signature.
// Can use swr with auto refresh enabled to update following status without user reload
const [data, setData] = useState(null);
const [isLoading, setLoading] = useState(false);
useEffect(() => {
  if (session) {
    setLoading(true);
    // Load the check to see if the user is following and store it in state
    fetch("api/check-is-following")
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  }
}, [session]);
```

We use this information on the client to show either a **mint** [Web3Button](https://portal.thirdweb.com/react/react.web3button), or a **follow** button to the user:

```jsx
data ? (
  <div>
    <h3>Hey {session?.user?.name} 👋</h3>
    <h4>Thanks for being a Twitter follower.</h4>
    <p>Here is a reward for you!</p>

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
  <div>
    <p>Looks like you are not a Twitter follower.</p>
    <a href={`https://twitter.com/thirdweb_`}>Follow</a>
  </div>
);
```

Now the user can either make another request to mint the NFT, or follow on Twitter.

## Signature Based Minting

_This section is forked from and closely follows the [community rewards](https://github.com/thirdweb-example/community-rewards) example_

On the client-side, when the user clicks the `Mint` button, we make a request to the [generate-signature](./pages/api/generate-signature.js) API route to ask the server to generate a signature for us to use to mint an NFT.

```jsx
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
```

The API uses the check as described above, where we pass the twitterFollower (`data.twitterFollower`) and session variables to the body of the API call to ensure the user is a Twitter follower before generating a signature.

```jsx
// Return an error response if the user is not following the account
// This prevents the signature from being generated if they are not a follower
if (twitterFollower === "undefined") {
  res.status(403).send("User is not a follower.");
  return;
}
```

If the user is a follower, we can start the process of generating the signature for the NFT.

Firstly, we initialize the thirdweb SDK using our private key.

```jsx
// Initialize the Thirdweb SDK on the serverside using the private key on the goerli network
const sdk = ThirdwebSDK.fromPrivateKey(process.env.PRIVATE_KEY, "goerli");
```

You'll need another entry in your `.env.local` file, containing your private key for this to work.

**IMPORTANT:** Never use your private key value outside of a secured server-side environment.

```
PRIVATE_KEY=<your-private-key-here>
```

Next, we get our NFT collection contract:

```jsx
// Load the NFT Collection via its contract address using the SDK
const nftCollection = sdk.getNFTCollection(contractAddress);
```

And finally generate the signature for the NFT:

We use the information of the user's Twitter profile for the metadata of the NFT! How cool is that?

```jsx
// Generate the signature for the NFT mint transaction
const signedPayload = await nftCollection.signature.generate({
  to: claimerAddress,
  metadata: {
    name: `${session.user.name}'s Thirdweb Twitter Follower NFT`,
    image: `${session.user.image}`,
    description: `An NFT rewarded to ${session.user.name} for being a thirdweb Twitter Follower!`,
  },
});
```

And return this signature back to the client:

```jsx
// Return back the signedPayload (mint signature) to the client.
res.status(200).json({
  signedPayload: JSON.parse(JSON.stringify(signedPayload)),
});
```

The client uses this signature to `mint` the NFT that was generated on the server back on [index.js](./pages/index.js):

```jsx
// If the user meets the criteria to have a signature generated, we can use the signature
// on the client side to mint the NFT from this client's wallet
if (signature.status === 200) {
  const json = await signature.json();
  const signedPayload = json.signedPayload;

  // Use the signature to mint the NFT from this wallet
  const nft = await nftCollectionContract?.signature.mint(signedPayload);
}
```

Voilà! You have generated a signature for an NFT on the server-side, and used the signature to mint that NFT on the client side! Effectively, restricting access to an exclusive set of users to mint NFTs in your collection.

## Going to production

In a production environment, you need to have an environment variable called `NEXTAUTH_SECRET` for the Twitter OAuth to work.

You can learn more about it [here](https://next-auth.js.org/configuration/options).

You can quickly create a good value on the command line via this openssl command.

```bash
openssl rand -base64 32
```

And add it as an environment variable in your `.env.local` file:

```
NEXTAUTH_SECRET=<your-value-here>
```

## Join our Discord!

For any questions, suggestions, join our discord at [https://discord.gg/cd thirdweb](https://discord.gg/thirdweb).
