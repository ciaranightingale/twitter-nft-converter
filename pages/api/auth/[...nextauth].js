import NextAuth from "next-auth";
import TwitterProvider from "next-auth/providers/twitter";

export const authOptions = {
  // Configure authentication provider
  // Querying the followers Twitter API on behalf of the client requires the following scopes
  // Scopes allow granular access to the required permissions
  providers: [
    TwitterProvider({
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      version: "2.0",
      authorization: {
        params: {
          scope: "follows.read users.read tweet.read",
        },
      },
    }),
  ],

  // When the user signs in, get their token
  callbacks: {
    async jwt({ token, account, user }) {
      // Add the user ID to the token user data
      if (user) {
        token["user"] = {
          userId: user.id,
        };
      }
      // Add the OAuth access_token to the token after signin
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },

    async session({ session, token }) {
      // Send properties to the client
      session.accessToken = token.accessToken;
      session.user.id = token.user.userId;
      return session;
    },
  },
};

export default NextAuth(authOptions);
