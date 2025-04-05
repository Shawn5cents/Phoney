import { NextResponse } from 'next/server';
import { personalityStore } from '@/lib/personality-store';

export async function POST(request: Request) {
  try {
    const { personalityId } = await request.json();

    if (!personalityId) {
      return NextResponse.json(
        { error: 'Missing personalityId' },
        { status: 400 }
      );
    }

    const success = personalityStore.setCurrentPersonality(personalityId);

    if (!success) {
      return NextResponse.json(
        { error: 'Invalid personality ID' },
        { status: 400 }
      );
    }

    const personality = personalityStore.getCurrentPersonality();

    return NextResponse.json({
      success: true,
      personality: {
        id: personalityId,
        name: personality.name,
        traits: personality.traits
      }
    });
  } catch (error) {
    console.error('Error setting personality:', error);
    return NextResponse.json(
      { error: 'Failed to set personality' },
      { status: 500 }
    );
  }
}
