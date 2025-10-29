import { NextResponse } from 'next/server';
import { unstable_noStore as noStore } from 'next/cache';
import { updateTicketStatus } from '@/app/services/googleSheetsService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function POST(req) {
  try {
    noStore();
    const { securityCode } = await req.json();
    if (!securityCode) {
      return NextResponse.json(
        { success: false, message: 'Código no proporcionado.' },
        {
          status: 400,
          headers: {
            'CDN-Cache-Control': 'no-store',
            'Vercel-CDN-Cache-Control': 'no-store',
            'Cache-Control': 'no-store',
          },
        },
      );
    }

    const result = await updateTicketStatus(securityCode);
    const status = result.success ? 200 : 400;

    return NextResponse.json(result, {
      status,
      headers: {
        'CDN-Cache-Control': 'no-store',
        'Vercel-CDN-Cache-Control': 'no-store',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('❌ Error en verify-ticket:', error);
    return NextResponse.json(
      { success: false, message: 'Error del servidor.' },
      {
        status: 500,
        headers: {
          'CDN-Cache-Control': 'no-store',
          'Vercel-CDN-Cache-Control': 'no-store',
          'Cache-Control': 'no-store',
        },
      },
    );
  }
}