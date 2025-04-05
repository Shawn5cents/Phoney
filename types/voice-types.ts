export interface GoogleTTSVoice {
  languageCode: string;
  name: string;
  ssmlGender: 'MALE' | 'FEMALE' | 'NEUTRAL';
}

export interface AIPersonalityVoice extends GoogleTTSVoice {
  type: 'professional' | 'friendly' | 'witty' | 'zen';
  displayName: string;
}

export interface TTSRequest {
  text: string;
  voice: GoogleTTSVoice;
}

export type TwilioVoice = 'man' | 'woman' | 'alice' | 'polly.matthew' | 'polly.joanna';

export interface TwilioSayOptions {
  voice?: TwilioVoice;
  language?: string;
}

export type TwilioGatherInput = 'dtmf' | 'speech';

export interface TwilioGatherOptions {
  input: TwilioGatherInput[];
  action: string;
  method: string;
  speechTimeout?: string | number;
  enhanced?: boolean;
}
