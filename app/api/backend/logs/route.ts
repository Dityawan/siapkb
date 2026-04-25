import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME, getSession } from '@/lib/auth';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    const session = await getSession(sessionCookie);

    if (!session || session.role !== 'superadmin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const logs = await prisma.loginLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50, // ambil 50 log terbaru
    });

    return NextResponse.json({ success: true, data: logs });
  } catch (error: any) {
    console.error('Error fetching logs:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
