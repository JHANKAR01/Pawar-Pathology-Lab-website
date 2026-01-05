import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Missing email or password");
                }

                await dbConnect();

                const email = credentials.email.toLowerCase().trim();
                const user = await User.findOne({ email });

                if (!user) {
                    throw new Error("User not found");
                }

                if (user.isActive === false) {
                    throw new Error("Account is deactivated. Contact admin.");
                }

                // Compare passwords using bcrypt ONLY
                const isValid = await bcrypt.compare(credentials.password, user.password);

                if (!isValid) {
                    throw new Error("Invalid password");
                }

                return {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    phone: user.phone,
                    address: user.address,
                };
            },
        }),
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            if (account?.provider === 'google') {
                await dbConnect();
                if (!profile?.email) return false;

                const email = profile.email.toLowerCase();
                const existingUser = await User.findOne({ email });

                if (existingUser) {
                    if (existingUser.isActive === false) {
                        return false; // Bloack sign in
                    }
                    // Start session for existing user
                    user.id = existingUser._id.toString();
                    user.role = existingUser.role;
                    user.phone = existingUser.phone;
                    user.address = existingUser.address;
                    return true;
                } else {
                    // New Google User
                    // We need phone/address. Since we deleted complete-profile, 
                    // we must either auto-create with defaults or fail.
                    // For now, we allow creation but they might have issues booking without phone.
                    // Ideally we'd redirect to a "finish signup" page but that was deleted by request.
                    // We'll create with a placeholder phone to satisfy Schema.

                    const randomPassword = Math.random().toString(36).slice(-8);
                    const hashedPassword = await bcrypt.hash(randomPassword, 10);

                    const newUser = await User.create({
                        name: profile.name || user.name || 'Google User',
                        email: email,
                        password: hashedPassword,
                        role: 'patient',
                        operationalRole: 'none',
                        phone: '0000000000', // Placeholder
                        address: 'Update your address', // Placeholder
                        isVerified: true
                    });

                    user.id = newUser._id.toString();
                    user.role = newUser.role;
                    user.phone = newUser.phone;
                    user.address = newUser.address;
                    return true;
                }
            }
            return true;
        },
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = user.id;
                token.role = user.role?.toLowerCase() || 'patient';
                token.phone = user.phone;
                token.address = user.address;
            }

            // Handle client-side updates
            if (trigger === "update" && session) {
                token.id = session.user.id || token.id;
                token.role = session.user.role || token.role;
                token.phone = session.user.phone || token.phone;
                token.address = session.user.address || token.address;
            }

            // Sync with DB on subsequent requests to keep phone/address updated
            if (token.email) {
                await dbConnect();
                const dbUser = await User.findOne({ email: token.email.toLowerCase() });
                if (dbUser) {
                    if (dbUser.isActive === false) {
                        throw new Error("Account deactivated");
                    }
                    token.id = dbUser._id.toString();
                    token.role = dbUser.role?.toLowerCase();
                    token.phone = dbUser.phone;
                    token.address = dbUser.address;
                }
            }

            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id;
                session.user.role = token.role;
                session.user.phone = token.phone;
                session.user.address = token.address;
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
        maxAge: 7200, // 2 Hours
    },
    secret: process.env.NEXTAUTH_SECRET,
};
