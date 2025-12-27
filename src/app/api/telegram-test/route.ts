import { NextResponse } from 'next/server';

/**
 * @fileOverview A simple test endpoint for Telegram webhook verification.
 * This endpoint immediately responds with 'OK' and logs the request details,
 * helping to diagnose if network or firewall issues are blocking requests
 * from reaching the application.
 */
export async function POST(req: Request) {
    console.log('--- [LOG] TELEGRAM-TEST WEBHOOK RECEIVED ---');
    try {
        const body = await req.json();
        console.log('--- [DEBUG] Test webhook body:', JSON.stringify(body, null, 2));
    } catch (e) {
        console.warn('--- [WARN] Could not parse test webhook body as JSON.');
    }
    return NextResponse.json({ status: 'ok', message: 'Test endpoint is working.' });
}