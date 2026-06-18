import { betterAuth, google } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { connectDb } from "./mongoDB";
import { Resend } from "resend";
import mongoose from "mongoose";
await connectDb()
const client = mongoose.connection.getClient()
const { ObjectId } = mongoose.Types
const resend = new Resend(process.env.RESEND_API_KEY)

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
    trustedOrigins: [
    "http://localhost:3000",
    "https://nextjs-better-auth-lime.vercel.app",
  ],
  database: mongodbAdapter(client.db()),
  user: {
    additionalFields: {  // add role field in user collection
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url, token }) => {
      console.log("RESET EMAIL CALLED", user.email);
      console.log(user.email);
      console.log(url);
      await resend.emails.send({
        from: "Zaita.com <onboarding@resend.dev>",
        to: user.email,
        subject: "Reset Password",
        html: `<a href="${url}">Reset Password</a>`,
      })
    },
    onPasswordReset: async ({ user }) => {
      console.log(
        `Password for ${user.email} has been reset`
      );
    }
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      resend.emails.send({
        from: 'Zaita.com <onboarding@resend.dev>',
        to: user.email,
        subject: 'Verify your email',
        html: `
          <h2>Verify Your Email</h2>
          <p>Click the button below:</p>
          <a href="${url}">Verify Email</a>
        `,
      })
    }
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_SECRET,
      mapProfileToUser: (profile) => ({
        image: profile.picture,  // Google image
        name: profile.name,
        email: profile.email,
      }),

    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_SECRET,
      mapProfileToUser: (profile) => ({  // 👈 yeh bhi add karo
        image: profile.avatar_url,  // GitHub image
        name: profile.name,
        email: profile.email,
      }),
    }
  },
  account: {
    accountLinking: {
      enabled: true,                    // linking enable karo
      trustedProviders: ["google", "github"],     // google ko trusted mark karo
    }
  },

  databaseHooks: {
    session: {                                           // change user details with provider details
      create: {
        before: async (session) => {
          try {
            const { ObjectId } = mongoose.Types;

            // userId ko ObjectId mein convert karo
            const userObjectId = new ObjectId(session.userId);

            // Latest account dhundo
            const account = await mongoose.connection
              .collection('account')
              .findOne(
                { userId: userObjectId },
                { sort: { updatedAt: -1 } }
              );

            // console.log("Account found:", account?.providerId); // debug

            if (!account) return { data: session };

            let updateData = {};

            // Google ya koi bhi idToken wala provider
            if (account.idToken) {
              const payload = JSON.parse(
                Buffer.from(account.idToken.split('.')[1], 'base64').toString()
              );
              // console.log("idToken payload:", payload); // debug
              updateData = {
                image: payload.picture || payload.photo,
                name: payload.name,
                email: payload.email,
              };

              // GitHub ya koi bhi accessToken wala provider
            } else if (account.accessToken) {
              // GitHub ka sahi URL
              const apiUrls = {
                github: 'https://api.github.com/user',
                twitter: 'https://api.twitter.com/2/users/me',
                discord: 'https://discord.com/api/users/@me',
              };

              const apiUrl = apiUrls[account.providerId];

              if (apiUrl) {
                const res = await fetch(apiUrl, {
                  headers: {
                    Authorization: `Bearer ${account.accessToken}`,
                  }
                });
                const providerUser = await res.json();
                // console.log("Provider user:", providerUser); // debug
                updateData = {
                  image: providerUser.avatar_url || providerUser.profile_image_url,
                  name: providerUser.name,
                  email: providerUser.email,
                };
              }
            }

            // User update karo
            await mongoose.connection.collection('user').updateOne(
              { _id: userObjectId },
              { $set: updateData }
            );

            return { data: session };

          } catch (err) {
            console.error("databaseHooks error:", err);
            return { data: session }; // error pe bhi session return karo
          }
        }
      }
    }
  }
})


