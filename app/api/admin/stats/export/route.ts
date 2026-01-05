
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Booking from '@/models/Booking';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/next-auth-options';
import ExcelJS from 'exceljs';

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);

    // Security Check: Only Admin or Master can export
    if (!session || (session.user.role?.toLowerCase() !== 'admin' && session.user.role?.toLowerCase() !== 'master')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();

    try {
        // 1. Fetch Today's Bookings
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const bookings = await Booking.find({
            createdAt: { $gte: startOfDay, $lte: endOfDay }
        }).sort({ createdAt: -1 });

        // 2. Create Workbook & Worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Daily Report');

        // 3. Define Columns
        worksheet.columns = [
            { header: 'Booking ID', key: 'bookingId', width: 25 },
            { header: 'Patient Name', key: 'patientName', width: 20 },
            { header: 'Phone', key: 'phone', width: 15 },
            { header: 'Tests', key: 'tests', width: 30 },
            { header: 'Total Amount', key: 'amount', width: 15 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Partner', key: 'partner', width: 20 },
            { header: 'Date', key: 'date', width: 20 },
        ];

        // 4. Style Header Row
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };

        // 5. Add Data Rows
        bookings.forEach((booking: any) => {
            const testsString = booking.tests.map((t: any) => t.title || t.testTitle).join(', ');

            worksheet.addRow({
                bookingId: booking._id.toString(),
                patientName: booking.patientName,
                phone: booking.contactNumber,
                tests: testsString,
                amount: booking.totalAmount,
                status: booking.status.toUpperCase(),
                partner: booking.assignedPartnerName || 'Unassigned',
                date: new Date(booking.createdAt).toLocaleString('en-IN')
            });
        });

        // 6. Generate Buffer
        const buffer = await workbook.xlsx.writeBuffer();

        // 7. Return Response with Correct Headers
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');

        const filename = `${day}-${month}-${year}_${hours}-${minutes}-${seconds}_Report.xlsx`;

        return new NextResponse(buffer as any, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="${filename}"`
            }
        });

    } catch (error) {
        console.error('Export Error:', error);
        return NextResponse.json({ error: 'Failed to generate export' }, { status: 500 });
    }
}
