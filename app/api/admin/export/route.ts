import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/dbConnect';
import Booking from '@/models/Booking';
import { authOptions } from '@/lib/next-auth-options';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const allowedRoles = ['admin', 'master'];
        if (!session.user.role || !allowedRoles.includes(session.user.role)) {
            return NextResponse.json(
                { message: "Forbidden. Admin access required." },
                { status: 403 }
            );
        }

        await dbConnect();

        // Fetch all bookings sorted by date (newest first)
        const bookings = await Booking.find({})
            .sort({ createdAt: -1 })
            .lean();

        if (!bookings || bookings.length === 0) {
            return NextResponse.json(
                { message: "No bookings found to export." },
                { status: 404 }
            );
        }

        // Define CSV headers
        const headers = [
            "Booking ID",
            "Date",
            "Patient Name",
            "Contact Number",
            "Email",
            "Tests",
            "Total Amount",
            "Status",
            "Payment Status",
            "Payment Mode",
            "Collection Type",
            "Address",
            "Referred By",
            "Partner",
            "Pathologist Notes"
        ];

        // Convert bookings to CSV rows
        const csvRows = bookings.map((booking: any) => {
            const date = new Date(booking.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
            const tests = booking.tests?.map((t: any) => t.title).join("; ") || "";
            // Handle fields that might be missing or need formatting
            const row = [
                booking._id?.toString() || "",
                `"${date}"`, // Quote to handle commas in date if any
                `"${booking.patientName || ""}"`,
                `"${booking.contactNumber || ""}"`,
                `"${booking.email || ""}"`,
                `"${tests}"`,
                booking.totalAmount || 0,
                booking.status || "",
                booking.paymentStatus || "",
                booking.paymentMode || "",
                booking.collectionType || "",
                `"${booking.address || ""}"`,
                `"${booking.referredBy || ""}"`,
                `"${booking.assignedPartnerName || ""}"`,
                `"${(booking.pathologistNotes || "").replace(/"/g, '""')}"` // Escape quotes
            ];
            return row.join(",");
        });

        // Combine headers and rows
        const csvContent = [headers.join(","), ...csvRows].join("\n");

        // Return CSV response
        return new NextResponse(csvContent, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="bookings-export-${new Date().toISOString().split('T')[0]}.csv"`
            }
        });

    } catch (error: any) {
        console.error("Export Error:", error);
        return NextResponse.json(
            { message: "Internal Server Error", error: error.message },
            { status: 500 }
        );
    }
}
