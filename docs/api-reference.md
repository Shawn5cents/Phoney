# 📚 API Reference

## Endpoints

### 📞 Call Management

#### POST `/api/incoming-call`
Handles incoming phone calls from Twilio.
```typescript
POST /api/incoming-call
Content-Type: application/json

{
  "CallSid": string,
  "From": string,
  "To": string,
  "Direction": string
}
```

#### POST `/api/process-speech`
Processes speech input and returns AI response.
```typescript
POST /api/process-speech
Content-Type: application/json

{
  "callId": string,
  "transcript": string,
  "confidence": number
}
```

#### POST `/api/take-over-call`
Enables human intervention in active calls.
```typescript
POST /api/take-over-call
Content-Type: application/json

{
  "callId": string,
  "agentId": string,
  "action": "take-over" | "return-to-ai"
}
```

## Events

### Pusher Events

#### `call.started`
```typescript
{
  callId: string,
  timestamp: string,
  caller: string,
  recipient: string
}
```

#### `call.transcription`
```typescript
{
  callId: string,
  timestamp: string,
  text: string,
  speaker: "user" | "ai"
}
```

#### `call.ended`
```typescript
{
  callId: string,
  timestamp: string,
  duration: number,
  reason: string
}
```

## Models

### Call Object
```typescript
interface Call {
  id: string;
  status: "active" | "ended";
  startTime: string;
  endTime?: string;
  caller: string;
  recipient: string;
  transcripts: Transcript[];
  interventions: Intervention[];
}
```

### Transcript Object
```typescript
interface Transcript {
  id: string;
  callId: string;
  timestamp: string;
  text: string;
  speaker: "user" | "ai";
  confidence: number;
}
```

### Intervention Object
```typescript
interface Intervention {
  id: string;
  callId: string;
  agentId: string;
  startTime: string;
  endTime?: string;
  reason?: string;
}
```

## Error Codes

| Code | Description |
|------|-------------|
| 1001 | Call not found |
| 1002 | Invalid call state |
| 1003 | Transcription failed |
| 1004 | AI response error |
| 1005 | Voice generation failed |
| 2001 | Authentication failed |
| 2002 | Rate limit exceeded |
| 3001 | Invalid request body |
| 5001 | Internal server error |

## Rate Limits

- Incoming calls: 100/minute
- Speech processing: 300/minute
- Take-over actions: 50/minute

## Authentication

All API endpoints require authentication using:
1. API Key in headers
2. JWT token for dashboard access
3. Webhook signatures for Twilio
