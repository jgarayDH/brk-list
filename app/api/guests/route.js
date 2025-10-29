import { NextResponse } from 'next/server';
import { unstable_noStore as noStore } from 'next/cache';
import { getSheetData } from '@/app/services/googleSheetsService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  try {
    noStore(); // desactiva caches de Next
    const guests = await getSheetData('Guests');

    return NextResponse.json(guests, {
      headers: {
        // Navegador + proxies
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        // CDN de Vercel
        'CDN-Cache-Control': 'no-store',
        'Vercel-CDN-Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error fetching guest data:', error);
    return NextResponse.json(
      { success: false, message: 'Error fetching guests' },
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