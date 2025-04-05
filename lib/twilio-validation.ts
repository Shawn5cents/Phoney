import { headers } from 'next/headers';
import twilio from 'twilio';

interface TwilioValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates an incoming Twilio request
 * @param request The incoming request
 * @returns Validation result with error message if invalid
 */
export async function validateTwilioRequest(request: Request): Promise<TwilioValidationResult> {
  const twilioSignature = headers().get('x-twilio-signature');
  
  if (!twilioSignature) {
    return {
      isValid: false,
      error: 'Missing Twilio signature'
    };
  }

  const formData = await request.formData();
  const callerNumber = formData.get('From') as string;
  const callSid = formData.get('CallSid') as string;

  if (!callerNumber || !callSid) {
    return {
      isValid: false,
      error: 'Missing required parameters'
    };
  }

  if (!/^CA[a-f0-9]{32}$/.test(callSid)) {
    return {
      isValid: false,
      error: 'Invalid CallSid format'
    };
  }

  return {
    isValid: true
  };
}

/**
 * Validates and extracts call data from a Twilio request
 * @param request The incoming request
 * @returns Call data if valid, null if invalid
 */
export async function validateAndExtractCallData(request: Request) {
  const validation = await validateTwilioRequest(request);
  
  if (!validation.isValid) {
    return null;
  }

  const formData = await request.formData();
  return {
    callerNumber: formData.get('From') as string,
    callSid: formData.get('CallSid') as string
  };
}
