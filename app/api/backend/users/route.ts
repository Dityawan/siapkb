import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET - Ambil semua user
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        // password TIDAK dikembalikan
      },
    });
    return NextResponse.json({ success: true, data: users });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

// POST - Buat user baru
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, username, password, role } = body;

    if (!name || !username || !password) {
      return NextResponse.json({ success: false, error: 'Nama, username, dan password wajib diisi' }, { status: 400 });
    }

    // Cek apakah username sudah ada
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return NextResponse.json({ success: false, error: 'Username sudah digunakan' }, { status: 409 });
    }

    const user = await prisma.user.create({
      data: {
        name,
        username,
        password, // Catatan: di produksi nyata, hash password dengan bcrypt
        role: role || 'admin',
        isActive: true,
      },
      select: { id: true, name: true, username: true, role: true, isActive: true, createdAt: true },
    });

    return NextResponse.json({ success: true, data: user }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
