import dbConnect from '@/lib/dbConnect';
import RateLimit from '@/models/RateLimit';

interface RateLimitResult {
    allowed: boolean;
    currentCount: number;
    limit: number;
}

const ROLE_LIMITS: Record<string, number> = {
    guest: 80,    // Shared Wi-Fi support (~7 users * ~11 req/min)
    patient: 150, // Standard user usage
    partner: 500, // Bulk booking allowance
    admin: 1000,  // Management tasks
};

export async function checkRateLimit(identifier: string, role: string = 'guest'): Promise<RateLimitResult> {
    // Normalize role to lowercase and default to guest if unknown
    const limit = ROLE_LIMITS[role.toLowerCase()] || ROLE_LIMITS['guest'];

    try {
        await dbConnect();

        // Atomically increment the count. 
        // We use $inc for atomicity.
        // upsert: true ensures we create a record if it doesn't exist.
        // We do NOT update 'lastRequest' here, so the TTL (60s) counts from the *first* request in this window.
        const record = await RateLimit.findOneAndUpdate(
            { identifier },
            {
                $inc: { count: 1 },
                // Ensure lastRequest is set on insert, but not updated on subsequent hits
                // This keeps the window fixed to 60s from start
                $setOnInsert: { lastRequest: new Date() }
            },
            { upsert: true, new: true }
        );

        const currentCount = record.count;

        return {
            allowed: currentCount <= limit,
            currentCount,
            limit
        };

    } catch (error) {
        console.warn('[RateLimiter] DB unavailable – fail-open triggered', error);

        // Fail-open logic: Allow request if DB is down
        return {
            allowed: true,
            currentCount: 0,
            limit
        };
    }
}
