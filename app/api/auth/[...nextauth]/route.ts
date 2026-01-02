import NextAuth, { NextAuthOptions, DefaultSession } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

// Module Augmentation to include all necessary fields
declare module "next-auth" {
  interface Session {
    accessToken?: string;
    userId?: string;
    role?: string;
    phone?: string;
    address?: string;
    needsProfileCompletion?: boolean;
    user: {
      role?: string;
      _id?: string;
      phone?: string;
      address?: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    userId?: string;
    phone?: string;
    address?: string;
    accessToken?: string;
    needsProfileCompletion?: boolean;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;
        
        await dbConnect();
        const user = await User.findOne({ 
          $or: [{ username: credentials.username }, { email: credentials.username }] 
        });

        if (!user) throw new Error('No user found');
        if (!user.password) throw new Error('User registered with Google. Please use Google to sign in.');

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
        if (!isPasswordValid) throw new Error('Invalid password');

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        };
      }
    })
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        await dbConnect();
        let dbUser = await User.findOne({ email: user.email });
        if (!dbUser) {
          await User.create({
            username: user.email?.split('@')[0] || `user_${Date.now()}`,
            email: user.email!,
            name: user.name || 'User',
            password: '', 
            role: 'patient',
            phone: '', 
            address: '', 
          });
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.userId = user.id;
      }

      if (token.email) {
        await dbConnect();
        const dbUser = await User.findOne({ email: token.email }).lean();
        
        if (dbUser) {
          token.name = dbUser.name; // Sync name to token
          token.role = dbUser.role;
          token.userId = dbUser._id.toString();
          token.phone = dbUser.phone; // Sync phone to token
          token.address = dbUser.address; // Sync address to token
          token.needsProfileCompletion = !dbUser.phone || !dbUser.address;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.name = token.name;
        session.user.role = token.role;
        session.user._id = token.userId;
        session.user.phone = token.phone;
        session.user.address = token.address;
        
        session.userId = token.userId;
        session.role = token.role;
        session.phone = token.phone;
        session.address = token.address;
        session.needsProfileCompletion = token.needsProfileCompletion;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };