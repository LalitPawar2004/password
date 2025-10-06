import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { ObjectId } from 'mongoose';
import jwt from 'jsonwebtoken';
import connectToDatabase from '../../../lib/mongodb';
import VaultItem from '../../../models/VaultItem';

// Use same fallback secret as the pages/api auth login route so tokens verify in dev
const JWT_SECRET = process.env.JWT_SECRET || '5a960b8011f8f0486af2163c70f120ae27d44c8a99ecdec076282b965dddc01c182c9525a6ce6577e62ea0c6ef8ce4b9';

async function authenticateFromHeader(req: Request) {
  if (!JWT_SECRET) return null;
  const auth = req.headers.get('authorization') || '';
  if (!auth.startsWith('Bearer ')) return null;
  const token = auth.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch (e) {
    return null;
  }
}

export async function DELETE(req: Request) {
  const userId = await authenticateFromHeader(req);
  if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid ID' }, { status: 400 });
    }

    await connectToDatabase();

    const deleted = await VaultItem.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!deleted) {
      return NextResponse.json({ message: 'Item not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error('Vault DELETE error', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const userId = await authenticateFromHeader(req);
  if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    await connectToDatabase();
    const items = await VaultItem.find({ userId: new mongoose.Types.ObjectId(userId) });
    return NextResponse.json(items);
  } catch (error) {
    console.error('Vault GET error', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const userId = await authenticateFromHeader(req);
  if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { title, username, ciphertext, iv, salt, url = '', notes = '' } = body;

    if (!title || !username || !ciphertext || !iv || !salt) {
      return NextResponse.json({ message: 'Missing required vault item fields' }, { status: 400 });
    }

    await connectToDatabase();

    const vaultItem = new VaultItem({
      userId: new mongoose.Types.ObjectId(userId),
      title,
      username,
      ciphertext,
      iv,
      salt,
      url,
      notes,
    });

    await vaultItem.save();

    return NextResponse.json({ message: 'Vault item saved' }, { status: 201 });
  } catch (error) {
    console.error('Vault POST error', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
