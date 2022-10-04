import { ThirdwebSDK } from "@thirdweb-dev/sdk";
import { contractAddress } from "../../constants";

export default async function generateNftSignature(req, res) {
  // Grab the claimer address (currently connected address) out of the request body
  const { claimerAddress } = JSON.parse(req.body);
  const { data } = JSON.parse(req.body);
  const { session } = JSON.parse(req.body);

  //Check if user is a thirdweb follower and return undefined or the server object
  const twitterFollower = data.twitterFollower;

  // Return an error response if the user is not following the account
  // This prevents the signature from being generated if they are not a member
  if (twitterFollower === "undefined") {
    res.status(403).send("User is not a follower.");
    return;
  }

  // NOTE: Using environment variables to store your private key is unsafe and not best practice.
  // Learn how to store your private key securely here: https://portal.thirdweb.com/sdk/set-up-the-sdk/securing-your-private-key
  // This allows us (the contract owner) to control the generation of the mint signatures
  if (!process.env.PRIVATE_KEY) {
    throw new Error("You're missing PRIVATE_KEY in your .env.local file.");
  }

  // Initialize the Thirdweb SDK on the serverside using the private key on the goerli network
  const sdk = ThirdwebSDK.fromPrivateKey(process.env.PRIVATE_KEY, "goerli");

  // Load the NFT Collection via it's contract address using the SDK
  const nftCollection = await sdk.getNFTCollection(contractAddress);

  // Generate the signature for the NFT mint transaction
  const signedPayload = await nftCollection.erc721.signature.generate({
    to: claimerAddress,
    metadata: {
      name: `${session.user.name}'s thirdweb Twitter Follower NFT`,
      image: `${session.user.image}`,
      description: `An NFT rewarded for being a thirdweb follower!`,
    },
  });

  // Return back the signedPayload (mint signature) to the client.
  res.status(200).json({
    signedPayload: JSON.parse(JSON.stringify(signedPayload)),
  });
}
