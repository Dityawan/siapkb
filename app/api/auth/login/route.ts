import { NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, signToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { username, password } = (await req.json()) as {
      username?: string;
      password?: string;
    };

    if (!username || !password) {
      return NextResponse.json({ message: 'Username dan password wajib diisi' }, { status: 400 });
    }

    let loginSuccess = false;
    let loggedInUser = null;

    // 1. Cek user dari database (dari /backend Manajemen User)
    try {
      const user = await prisma.user.findUnique({ where: { username } });
      if (user && user.isActive && user.password === password) {
        loginSuccess = true;
        loggedInUser = {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
        };
      } else if (user && !user.isActive) {
        return NextResponse.json({ message: 'Akun Anda telah dinonaktifkan. Hubungi administrator.' }, { status: 403 });
      }
    } catch (dbErr) {
      console.error('DB check error, trying fallback .env:', dbErr);
    }

    // 2. Fallback ke .env HANYA untuk Super Admin
    if (!loginSuccess) {
      const envUsername = process.env.DASHBOARD_ADMIN_USERNAME;
      const envPassword = process.env.DASHBOARD_ADMIN_PASSWORD;
      if (username === envUsername && password === envPassword) {
        loginSuccess = true;
        loggedInUser = {
          id: 'superadmin-env',
          username: envUsername,
          name: 'Super Admin',
          role: 'superadmin',
        };
      }
    }

    if (!loginSuccess || !loggedInUser) {
      await prisma.loginLog.create({
        data: {
          username: username || 'unknown',
          ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
          userAgent: req.headers.get('user-agent') || 'unknown',
          status: 'failed',
        }
      }).catch(console.error);

      return NextResponse.json({ message: 'Username atau password salah' }, { status: 401 });
    }

    const token = await signToken(loggedInUser);

    await prisma.loginLog.create({
      data: {
        username: loggedInUser.username,
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
        status: 'success',
      }
    }).catch(console.error);

    const response = NextResponse.json({ message: 'Login berhasil', user: loggedInUser });
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8, // 8 jam
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Tidak bisa login. Cek koneksi database.' },
      { status: 500 },
    );
  }
}
