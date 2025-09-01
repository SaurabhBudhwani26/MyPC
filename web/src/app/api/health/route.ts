import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    services: {
      earnkaro: {
        configured: !!(process.env.EARNKARO_API_KEY && process.env.EARNKARO_API_URL),
        apiUrl: process.env.EARNKARO_API_URL
      },
      rapidapi: {
        configured: !!process.env.RAPIDAPI_KEY,
        hasKey: !!process.env.RAPIDAPI_KEY
      }
    }
  });
}
