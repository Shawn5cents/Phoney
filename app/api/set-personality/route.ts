import { NextResponse } from 'next/server';
import { personalities } from '@/lib/ai-personalities';
import { setCurrentPersonality } from '@/lib/personality-store';

export async function POST(request: Request) {
  try {
    const { personalityId } = await request.json();

    if (!personalities[personalityId]) {
      return NextResponse.json(
        { error: 'Invalid personality ID' },
        { status: 400 }
      );
    }

    // Store the selected personality
    setCurrentPersonality(personalityId);

    return NextResponse.json({
      success: true,
      personality: personalities[personalityId]
    });
  } catch (error) {
    console.error('Error setting personality:', error);
    return NextResponse.json(
      { error: 'Failed to set personality' },
      { status: 500 }
    );
  }
}
