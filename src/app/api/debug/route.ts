import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// Use same fallback secret as other handlers for dev convenience
const JWT_SECRET = process.env.JWT_SECRET || '5a960b8011f8f0486af2163c70f120ae27d44c8a99ecdec076282b965dddc01c182c9525a6ce6577e62ea0c6ef8ce4b9';

export async function GET(req: Request) {
  if (!JWT_SECRET) return NextResponse.json({ message: 'JWT secret not configured' }, { status: 500 });
  const auth = req.headers.get('authorization') || '';
  if (!auth.startsWith('Bearer ')) return NextResponse.json({ message: 'Unauthorized - missing Bearer' }, { status: 401 });
  const token = auth.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return NextResponse.json({ ok: true, decoded });
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err?.message || 'Invalid token' }, { status: 401 });
  }
}
