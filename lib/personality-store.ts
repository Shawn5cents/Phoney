let currentPersonality = 'professional';

export function getCurrentPersonality(): string {
  return currentPersonality;
}

export function setCurrentPersonality(personalityId: string): void {
  currentPersonality = personalityId;
}
