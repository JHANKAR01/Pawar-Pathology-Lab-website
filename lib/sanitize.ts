/**
 * Security utilities for input sanitization
 * Prevents XSS attacks by removing malicious content
 */

/**
 * Sanitizes user input to prevent XSS attacks
 * - Removes HTML/script tags
 * - Encodes special characters
 * - Trims excessive whitespace
 */
export function sanitizeInput(input: string): string {
    if (!input || typeof input !== 'string') return '';

    return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
        .replace(/<[^>]*>/g, '') // Remove all HTML tags
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+\s*=/gi, '') // Remove event handlers (onclick, onerror, etc.)
        .trim()
        .slice(0, 500); // Limit length to prevent DoS
}

/**
 * Sanitizes filename for Google Drive uploads
 * - Replaces spaces with underscores
 * - Removes invalid filename characters
 * - Removes consecutive underscores
 */
export function sanitizeFilename(filename: string): string {
    if (!filename || typeof filename !== 'string') return 'unknown';

    return filename
        .replace(/[^a-zA-Z0-9 ]/g, '_') // Replace invalid chars with underscore
        .replace(/\s+/g, '_') // Replace spaces with underscore
        .replace(/_+/g, '_') // Remove consecutive underscores
        .replace(/^_|_$/g, '') // Remove leading/trailing underscores
        .slice(0, 100); // Limit length
}

/**
 * Encodes HTML entities to prevent XSS in rendered content
 */
export function encodeHTMLEntities(text: string): string {
    if (!text || typeof text !== 'string') return '';

    const entityMap: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
        '/': '&#x2F;'
    };

    return text.replace(/[&<>"'\/]/g, (char) => entityMap[char] || char);
}

/**
 * Validates and sanitizes email addresses
 */
export function sanitizeEmail(email: string): string {
    if (!email || typeof email !== 'string') return '';

    const sanitized = email.toLowerCase().trim().slice(0, 255);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return emailRegex.test(sanitized) ? sanitized : '';
}
