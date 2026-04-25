import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// PATCH - Update user (aktif/nonaktif atau reset password)
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, password, role, isActive } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (password !== undefined && password !== '') updateData.password = password;
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, username: true, role: true, isActive: true, updatedAt: true },
    });

    return NextResponse.json({ success: true, data: user });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

// DELETE - Hapus user
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'User berhasil dihapus' });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
