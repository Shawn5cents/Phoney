declare module 'twilio/lib/twiml/VoiceResponse' {
  export type SayVoice = 
    | 'man' | 'woman' | 'alice'
    | 'en-AU-Neural2-A' | 'en-AU-Neural2-B' | 'en-AU-Neural2-C' | 'en-AU-Neural2-D'
    | 'en-GB-Neural2-A' | 'en-GB-Neural2-B' | 'en-GB-Neural2-C' | 'en-GB-Neural2-D'
    | 'en-US-Neural2-A' | 'en-US-Neural2-B' | 'en-US-Neural2-C' | 'en-US-Neural2-D' | 'en-US-Neural2-E' | 'en-US-Neural2-F' | 'en-US-Neural2-G' | 'en-US-Neural2-H' | 'en-US-Neural2-I' | 'en-US-Neural2-J';

  export interface SayAttributes {
    voice?: SayVoice;
    language?: string;
    loop?: number;
  }

  export interface GatherAttributes {
    input?: string[];
    action?: string;
    method?: string;
    timeout?: number;
    speechTimeout?: string | number;
    maxSpeechTime?: number;
    speechModel?: string;
    enhanced?: boolean;
    profanityFilter?: boolean;
    language?: string;
    hints?: string;
  }

  export interface StreamAttributes {
    url: string;
    track?: string;
    name?: string;
    maxLength?: number;
    parameter?: {
      name: string;
      value: string;
    }[];
  }

  export interface ConnectAttributes {
    action?: string;
    method?: string;
    timeout?: number;
  }

  export class VoiceResponse {
    say(attributes: SayAttributes, message: string): this;
    gather(attributes?: GatherAttributes): this;
    connect(attributes?: ConnectAttributes): this;
    stream(attributes: StreamAttributes): this;
    toString(): string;
  }
}

declare module 'twilio' {
  import { VoiceResponse } from 'twilio/lib/twiml/VoiceResponse';
  
  export const twiml: {
    VoiceResponse: typeof VoiceResponse;
  };
}