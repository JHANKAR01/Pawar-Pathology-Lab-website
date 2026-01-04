import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { checkRateLimit } from '@/lib/rateLimit';

type Handler = (req: NextRequest, context?: any) => Promise<NextResponse>;

export function withRateLimit(handler: Handler): Handler {
    return async (req: NextRequest, context?: any) => {
        // 1. Identify User/IP and Role
        const token = await getToken({ req });

        let identifier = req.ip || 'anonymous';
        let role = 'guest';

        if (token) {
            identifier = (token.id as string) || (token.sub as string);
            role = (token.role as string) || 'patient';
        }

        // 2. Check Rate Limit
        // This runs on Node.js runtime (API Route), so Mongoose is fully supported.
        const result = await checkRateLimit(identifier, role);

        if (!result.allowed) {
            return new NextResponse(
                JSON.stringify({
                    error: "High traffic detected from your network. For security, please wait 60 seconds or ensure you are logged in for higher access speeds."
                }),
                {
                    status: 429,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        // 3. Proceed to actual handler
        return handler(req, context);
    };
}
