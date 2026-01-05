
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Booking from '@/models/Booking';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/next-auth-options';
import ExcelJS from 'exceljs';
import { startOfDay, endOfDay } from 'date-fns';

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user.role !== 'admin' && session.user.role !== 'master')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const { searchParams } = new URL(request.url);
        const startDateParam = searchParams.get('startDate');
        const endDateParam = searchParams.get('endDate');

        const query: any = {};
        if (startDateParam && endDateParam) {
            query.createdAt = {
                $gte: startOfDay(new Date(startDateParam)),
                $lte: endOfDay(new Date(endDateParam))
            };
        }

        const bookings = await Booking.find(query).sort({ createdAt: -1 }).lean();

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Bookings Report');

        worksheet.columns = [
            { header: 'Booking ID', key: '_id', width: 25 },
            { header: 'Date', key: 'createdAt', width: 15 },
            { header: 'Patient Name', key: 'patientName', width: 20 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Total Amount', key: 'totalAmount', width: 15 },
            { header: 'Balance', key: 'balanceAmount', width: 15 },
            { header: 'Collection Type', key: 'collectionType', width: 15 },
        ];

        // Style Header
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };

        bookings.forEach((b: any) => {
            worksheet.addRow({
                _id: b._id.toString(),
                createdAt: b.createdAt ? new Date(b.createdAt).toLocaleDateString() : '-',
                patientName: b.patientName,
                status: b.status,
                totalAmount: b.totalAmount,
                balanceAmount: b.balanceAmount,
                collectionType: b.collectionType
            });
        });

        const buffer = await workbook.xlsx.writeBuffer();

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="bookings_report_${new Date().toISOString().split('T')[0]}.xlsx"`
            }
        });

    } catch (error) {
        console.error('Export Error:', error);
        return NextResponse.json({ error: 'Failed to generate export' }, { status: 500 });
    }
}
