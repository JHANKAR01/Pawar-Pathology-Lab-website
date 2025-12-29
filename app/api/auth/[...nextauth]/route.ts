import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        await dbConnect();
        
        // Check if user exists
        let dbUser = await User.findOne({ email: user.email });
        
        if (!dbUser) {
          // Create new user with Google sign-in
          dbUser = await User.create({
            username: user.email?.split('@')[0] || `user_${Date.now()}`,
            email: user.email!,
            name: user.name || 'User',
            password: '', // No password for Google users
            role: 'patient',
            phone: '', // Will be collected in profile completion
          });
        }
        
        return true;
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (account?.provider === 'google') {
        await dbConnect();
        const dbUser = await User.findOne({ email: token.email });
        
        if (dbUser) {
          // Generate JWT token for the user
          const jwtToken = jwt.sign(
            {
              userId: dbUser._id.toString(),
              role: dbUser.role,
              name: dbUser.name,
              email: dbUser.email,
            },
            process.env.JWT_SECRET!,
            { expiresIn: '7d' }
          );
          
          token.accessToken = jwtToken;
          token.userId = dbUser._id.toString();
          token.role = dbUser.role;
          token.phone = dbUser.phone;
          token.needsProfileCompletion = !dbUser.phone || !dbUser.address;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.accessToken = token.accessToken as string;
        session.userId = token.userId as string;
        session.role = token.role as string;
        session.needsProfileCompletion = token.needsProfileCompletion as boolean;
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

