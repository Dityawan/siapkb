import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME, getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    const session = await getSession(sessionCookie);

    if (!session || session.role !== 'superadmin') {
      return NextResponse.json({ success: false, error: 'Forbidden. Hanya super admin yang dapat menghapus laporan.' }, { status: 403 });
    }

    const { id } = await params;

    if (!id) {
        return NextResponse.json({ success: false, error: 'ID laporan tidak valid' }, { status: 400 });
    }

    await prisma.survey.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Laporan berhasil dihapus' });
  } catch (error: any) {
    console.error('Delete survey error:', error);
    return NextResponse.json({ success: false, error: 'Terjadi kesalahan saat menghapus laporan' }, { status: 500 });
  }
}
