import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectToDatabase from '@/lib/mongodb';
import VaultItem from '@/models/VaultItem';
import mongoose from 'mongoose';

// Use same fallback secret as pages/api auth login for dev convenience
const JWT_SECRET = process.env.JWT_SECRET || '5a960b8011f8f0486af2163c70f120ae27d44c8a99ecdec076282b965dddc01c182c9525a6ce6577e62ea0c6ef8ce4b9';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!JWT_SECRET) return NextResponse.json({ message: 'JWT secret not configured' }, { status: 500 });

  const auth = req.headers.get('authorization') || '';
  if (!auth.startsWith('Bearer ')) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  const token = auth.split(' ')[1];
  let userId: string;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    userId = decoded.userId;
  } catch (e) {
    return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
  }

  const body = await req.json();
  const { ciphertext, iv, salt, title, username, url = '', notes = '' } = body;
  if (!ciphertext || !iv || !salt) {
    return NextResponse.json({ message: 'Missing fields' }, { status: 400 });
  }

  try {
    await connectToDatabase();
  const id = (params as any).id;
  const item = await VaultItem.findById(id);
    if (!item || item.userId.toString() !== userId) return NextResponse.json({ message: 'Not found' }, { status: 404 });

    item.title = title || item.title;
    item.username = username || item.username;
    item.ciphertext = ciphertext;
    item.iv = iv;
    item.salt = salt;
    item.url = url;
    item.notes = notes;

    await item.save();
    return NextResponse.json({ message: 'Updated' });
  } catch (err) {
    console.error('PUT error', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
