# 📚 API Reference

## Endpoints

### 📞 Call Management

#### POST `/api/incoming-call`
Handles incoming phone calls from Twilio. Sets up WebSocket streaming and returns TwiML for real-time conversation.
```typescript
POST /api/incoming-call
Content-Type: application/x-www-form-urlencoded

{
  "CallSid": string,
  "From": string,
  "To": string,
  "Direction": string,
  // Other Twilio parameters
}
```

#### WebSocket `/api/audio-stream`
Handles real-time audio streaming and speech recognition.
```typescript
WebSocket /api/audio-stream?callSid={callSid}

// Incoming messages (binary audio data)
interface AudioChunk {
  metadata: {
    callSid: string;
    streamSid: string;
    timestamp: string;
  };
  payload: Buffer;
}

// Events emitted through Pusher
'speech.detected' - When speech is detected
'speech.recognized' - When speech is transcribed
'ai.response.partial' - Streaming AI response chunks
'ai.response.complete' - Final AI response
```

#### POST `/api/process-speech`
Processes speech input from Twilio, sends to Google Gemini, and returns AI response as TwiML.
```typescript
POST /api/process-speech
Content-Type: application/x-www-form-urlencoded

{
  "CallSid": string,
  "SpeechResult": string,  // The recognized speech
  "Confidence": string,    // Confidence score as string
  "CallStatus": string,
  // Other Twilio parameters
}
```

#### POST `/api/no-input`
Handles scenarios when no speech input is detected.
```typescript
POST /api/no-input
Content-Type: application/x-www-form-urlencoded

{
  "CallSid": string,
  "CallStatus": string,
  // Other Twilio parameters
}
```

#### POST `/api/transfer-call`
Transfers the current call to another phone number.
```typescript
POST /api/transfer-call
Content-Type: application/json

{
  "callSid": string,
  "transferTo": string  // Phone number to transfer to
}
```

## Pusher Events

### Channel: `calls`
Broadcasts events for all calls.

#### `call.started`
```typescript
{
  callId: string,
  caller: string,
  timestamp: string,
  personality: string
}
```

### Channel: `call-${callSid}`
Broadcasts events for a specific call.

#### `call.initialized`
```typescript
{
  status: 'active',
  wsUrl: string,  // WebSocket connection URL
  timestamp: string,
  personality: string
}
```

#### `speech.detected`
```typescript
{
  confidence: number,
  timestamp: string
}
```

#### `speech.recognized`
```typescript
{
  text: string,
  isFinal: boolean,
  confidence: number,
  timestamp: string
}
```

#### `ai.response.partial`
```typescript
{
  text: string,
  timestamp: string,
  turnCount: number
}
```

#### `ai.response.complete`
```typescript
{
  timestamp: string,
  turnCount: number
}
```

#### `call.completed`
```typescript
{
  callSid: string,
  duration: number,
  timestamp: string
}
```

## Models

### AIPersonalityConfig
```typescript
interface AIPersonalityConfig {
  name: string;
  systemPrompt: string;
  voiceId: SayVoice;  // Twilio voice identifier
  traits: string[];
  safetySettings?: SafetySetting[];
  temperature?: number;
  examples?: Array<{
    input: string;
    response: string;
  }>;
}
```

### Call Object (Client-side)
```typescript
interface Call {
  callSid: string;
  from: string;
  to: string;
  status: "in-progress" | "completed" | "failed";
  startTime: string;
  endTime?: string;
  transcript: {
    speaker: "user" | "ai";
    text: string;
    timestamp: string;
    isFinal?: boolean;
  }[];
  currentAIResponse?: string;
  personality?: string;
}
```

### TwiML Components
The application generates TwiML responses with streaming support:

```xml
<!-- Example Streaming TwiML -->
<Response>
  <Connect>
    <Stream url="wss://your-domain.com/api/audio-stream?callSid=CAXXXX" track="inbound_track" />
  </Connect>
  <Gather input="speech" action="/api/process-speech" method="POST"
         speechTimeout="auto" speechModel="phone_call" enhanced="true"
         language="en-US">
    <Say voice="en-US-Neural2-D">How can I assist you today?</Say>
  </Gather>
</Response>
```

## API Dependencies

### Google Speech-to-Text
Used for real-time speech recognition with streaming support.

```typescript
// Example streaming configuration
const streamingConfig = {
  config: {
    encoding: 'MULAW',
    sampleRateHertz: 8000,
    languageCode: 'en-US',
    model: 'phone_call',
    useEnhanced: true,
    enableAutomaticPunctuation: true,
    metadata: {
      interactionType: 'PHONE_CALL',
      industryNaicsCodeOfAudio: 518210,
      originalMediaType: 'AUDIO'
    }
  },
  interimResults: true
};
```

### Google Gemini API
Used for streaming AI responses based on speech input.

```typescript
// Example Gemini API streaming
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
const model = genAI.getGenerativeModel({ 
  model: "gemini-pro",
  generationConfig: {
    temperature: 0.7,
    topP: 0.8,
    topK: 40,
    maxOutputTokens: 200,
  }
});

// Streaming response
const result = await chat.sendMessageStream(userMessage);
for await (const chunk of result.stream) {
  const chunkText = chunk.text();
  // Process streaming response
}
```

### Google Text-to-Speech
Used for generating natural-sounding voice responses.

```typescript
// Example voice settings
const voiceSettings = {
  languageCode: "en-US",
  name: "en-US-Neural2-D",
  ssmlGender: "FEMALE"
};

// Converting text to speech
const [response] = await textToSpeechClient.synthesizeSpeech({
  input: { text: aiResponse },
  voice: voiceSettings,
  audioConfig: { audioEncoding: "MP3" },
});
```

### WebSocket Communication
Used for real-time audio streaming and speech processing.

```typescript
// Server-side WebSocket handling
wsServer.on('connection', async (ws, request) => {
  const url = new URL(request.url!, `http://${request.headers.host}`);
  const callSid = url.searchParams.get('callSid');
  
  ws.on('message', async (data) => {
    const chunk = JSON.parse(data.toString());
    // Process audio chunk
  });
});
```

## Security Considerations

- Ensure all API keys are stored securely in environment variables
- Validate incoming Twilio webhooks using signature validation
- Use Pusher's private channels for sensitive call data
- Implement proper error handling to avoid exposing system details
- Secure WebSocket connections with proper authentication
- Rate limit audio stream processing to prevent abuse
