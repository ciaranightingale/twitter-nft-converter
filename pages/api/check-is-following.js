import { unstable_getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import { twitterId } from "../../constants";

export default async function checkIsFollowing(req, res) {
  // Get the Next Auth session so we can use the accessToken as part of the Twitter API request
  const session = await unstable_getServerSession(req, res, authOptions);
  // Read the access token from the session
  const accessToken = session?.accessToken;

  // Make a request to the Twitter API to get the users followers
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

  // You may get rate limitd here and receive an error.

  // Parse the response as JSON
  const data = await response.json();

  // Filter all the followers to find the one we want
  // Returns undefined if the user is not a follower
  // Returns the follower object if the user is a member
  const thirdwebTwitterFollower = data?.data.find(
    (user) => user.id === twitterId
  );

  // Return undefined or the server object to the client.
  res
    .status(200)
    .json({ thirdwebFollower: thirdwebTwitterFollower ?? undefined });
}
