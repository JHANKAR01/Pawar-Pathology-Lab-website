/**
 * Mock tests for Booking Service
 * These tests assume a Jest-like environment.
 */

import { calculateSubtotal } from '@/lib/services/bookingService';
import Test from '@/models/Test';

// Mock the Test model
jest.mock('@/models/Test');

describe('Booking Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('calculateSubtotal', () => {
        it('should correctly sum prices from the database', async () => {
            const mockTests = [
                { _id: '1', title: 'CBC', price: 500, category: 'Blood' },
                { _id: '2', title: 'Sugar', price: 200, category: 'Blood' }
            ];

            (Test.find as jest.Mock).mockResolvedValue(mockTests);

            const testIds = ['1', '2'];
            const result = await calculateSubtotal(testIds);

            expect(result.subtotal).toBe(700);
            expect(result.tests).toHaveLength(2);
            expect(result.tests[0].price).toBe(500);
            expect(result.error).toBeUndefined();
        });

        it('should return error if some tests are not found', async () => {
            (Test.find as jest.Mock).mockResolvedValue([{ _id: '1', price: 500 }]);

            const testIds = ['1', '2']; // 2 IDs, but only 1 found
            const result = await calculateSubtotal(testIds);

            expect(result.subtotal).toBe(0);
            expect(result.error).toBe('Invalid test IDs provided');
        });
    });
});
