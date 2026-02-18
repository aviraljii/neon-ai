import { connectDB } from '@/lib/db';
import { UserLinks } from '@/models/UserLinks';
import { NextRequest, NextResponse } from 'next/server';

type Params = { params: Promise<{ username: string }> };

function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { username } = await params;
    const normalizedUsername = normalizeUsername(username);

    const profile = await UserLinks.findOne({ username: normalizedUsername });

    if (!profile) {
      return NextResponse.json({ username: normalizedUsername, links: [] });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Profile links GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile links' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { username } = await params;
    const normalizedUsername = normalizeUsername(username);
    const { title, url, userId } = await request.json();

    if (!title || !url) {
      return NextResponse.json({ error: 'title and url are required' }, { status: 400 });
    }

    const profile =
      (await UserLinks.findOne({ username: normalizedUsername })) ||
      new UserLinks({ username: normalizedUsername, userId: userId || undefined, links: [] });

    if (profile.userId && userId && profile.userId !== userId) {
      return NextResponse.json({ error: 'Not authorized to update this profile' }, { status: 403 });
    }

    if (!profile.userId && userId) {
      profile.userId = userId;
    }

    profile.links.push({ title, url });
    await profile.save();

    return NextResponse.json(profile, { status: 201 });
  } catch (error) {
    console.error('Profile links POST error:', error);
    return NextResponse.json({ error: 'Failed to add profile link' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { username } = await params;
    const normalizedUsername = normalizeUsername(username);
    const { linkId, title, url, userId } = await request.json();

    if (!linkId || !title || !url) {
      return NextResponse.json(
        { error: 'linkId, title and url are required' },
        { status: 400 }
      );
    }

    const profile = await UserLinks.findOne({ username: normalizedUsername });
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (profile.userId && userId && profile.userId !== userId) {
      return NextResponse.json({ error: 'Not authorized to update this profile' }, { status: 403 });
    }

    const link = profile.links.id(linkId);
    if (!link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    link.title = title;
    link.url = url;
    await profile.save();

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Profile links PUT error:', error);
    return NextResponse.json({ error: 'Failed to edit profile link' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { username } = await params;
    const normalizedUsername = normalizeUsername(username);
    const { linkId, userId } = await request.json();

    if (!linkId) {
      return NextResponse.json({ error: 'linkId is required' }, { status: 400 });
    }

    const profile = await UserLinks.findOne({ username: normalizedUsername });
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (profile.userId && userId && profile.userId !== userId) {
      return NextResponse.json({ error: 'Not authorized to update this profile' }, { status: 403 });
    }

    const link = profile.links.id(linkId);
    if (!link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    link.deleteOne();
    await profile.save();

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Profile links DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete profile link' }, { status: 500 });
  }
}
