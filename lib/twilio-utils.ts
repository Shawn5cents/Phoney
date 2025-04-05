export function createTwiMLWithAudio(audioUrl?: string, wsEndpoint?: string): string {
  let twiml = '<?xml version="1.0" encoding="UTF-8"?><Response>';
  
  if (audioUrl) {
    twiml += `<Play>${audioUrl}</Play>`;
  }

  if (wsEndpoint) {
    twiml += `<Connect><Stream url="${wsEndpoint}" track="inbound_track"/></Connect>`;
  }

  twiml += '</Response>';
  return twiml;
}

export function createErrorResponse(message: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="en-US-Neural2-D" language="en-US">${message}</Say>
</Response>`;
}