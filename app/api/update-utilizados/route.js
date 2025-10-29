import { NextResponse } from 'next/server';
import { unstable_noStore as noStore } from 'next/cache';
import { updateUtilizadosStatus } from '@/app/services/googleSheetsService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function POST(req) {
  try {
    noStore();
    const { sheetName, column, rowNumber, newValue } = await req.json();

    if (!sheetName || !column || !rowNumber || newValue === undefined) {
      return NextResponse.json(
        { success: false, message: 'Faltan datos' },
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

    await updateUtilizadosStatus(sheetName, column, rowNumber, newValue);

    return NextResponse.json(
      { success: true },
      {
        headers: {
          'CDN-Cache-Control': 'no-store',
          'Vercel-CDN-Cache-Control': 'no-store',
          'Cache-Control': 'no-store',
        },
      },
    );
  } catch (error) {
    console.error('❌ Error en API /update-utilizados:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
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