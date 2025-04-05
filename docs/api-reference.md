# 📚 API Reference

## Endpoints

### 📞 Call Management

#### POST `/api/incoming-call`
Handles incoming phone calls from Twilio. Returns TwiML to gather speech input.
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

#### `new-call`
```typescript
{
  callSid: string,
  from: string,
  to: string,
  status: string,
  timestamp: string
}
```

### Channel: `call-${callSid}`
Broadcasts events for a specific call.

#### `speech-received`
```typescript
{
  callSid: string,
  speechResult: string,
  confidence: number,
  timestamp: string
}
```

#### `ai-thinking`
```typescript
{
  callSid: string,
  timestamp: string
}
```

#### `ai-response-chunk`
```typescript
{
  callSid: string,
  chunk: string,  // Partial AI response
  isComplete: boolean,
  timestamp: string
}
```

#### `call-completed`
```typescript
{
  callSid: string,
  duration: number,
  timestamp: string
}
```

## Models

### AIPersonality
```typescript
interface AIPersonality {
  id: string;
  name: string;          // Display name (e.g., "Professional")
  description: string;   // Brief description
  systemPrompt: string;  // Google Gemini system prompt
  voiceSettings: {      // Google TTS voice settings
    languageCode: string;
    name: string;
    ssmlGender: "NEUTRAL" | "MALE" | "FEMALE";
  };
  examples: {           // Example conversations for context
    input: string;
    response: string;
  }[];
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
  }[];
  currentAIResponse?: string;
  personality?: string;
}
```

### TwiML Components
The application generates TwiML responses for Twilio:

```xml
<!-- Example Gather TwiML -->
<Response>
  <Gather input="speech" action="/api/process-speech" method="POST" timeout="10" 
         speechTimeout="auto" speechModel="phone_call" enhanced="true" 
         language="en-US" hints="yes, no, maybe, thanks, goodbye, transfer, Shawn">
    <Say>Hello, how can I help you today?</Say>
  </Gather>
  <Redirect method="POST">/api/no-input</Redirect>
</Response>
```

## API Dependencies

### Google Gemini API
Used for generating AI responses based on speech input.

```typescript
// Example Gemini API integration
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// Creating a chat session
const chat = model.startChat({
  history: previousMessages,
  generationConfig: {
    temperature: 0.7,
    topP: 0.8,
    topK: 40,
    maxOutputTokens: 200,
  },
  safetySettings: [...]
});

// Streaming response
const result = await chat.sendMessageStream(userMessage);
```

### Google Text-to-Speech
Used for generating natural-sounding voice responses.

```typescript
// Example voice settings
const voiceSettings = {
  languageCode: "en-US",
  name: "en-US-Studio-O",
  ssmlGender: "FEMALE"
};

// Converting text to speech
const [response] = await textToSpeechClient.synthesizeSpeech({
  input: { text: aiResponse },
  voice: voiceSettings,
  audioConfig: { audioEncoding: "MP3" },
});
```

### Pusher
Used for real-time updates to the dashboard.

```typescript
// Example Pusher initialization
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
});

// Triggering an event
await pusher.trigger("call-" + callSid, "ai-response-chunk", {
  callSid,
  chunk: responseChunk,
  isComplete: false,
  timestamp: new Date().toISOString(),
});
```

## Security Considerations

- Ensure all API keys are stored securely in environment variables
- Validate incoming Twilio webhooks using signature validation
- Use Pusher's private channels for sensitive call data
- Implement proper error handling to avoid exposing system details
