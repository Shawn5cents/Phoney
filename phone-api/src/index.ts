import express from 'express';
import dotenv from 'dotenv';
import twilio from 'twilio';
import { initCacheSystem } from './lib/filesystem-cache';
import { generateSpeech, formatTwilioAudio } from './lib/google-tts';
import { generateGeminiResponse } from './lib/gemini-ai';
import { personalities, getCurrentPersonality } from './lib/ai-personalities';
import { sendTranscription, notifyNewCall, updateCallStatus } from './lib/pusher-client';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Initialize the Twilio TwiML response generator
const { VoiceResponse } = twilio.twiml;

// Health check routes
app.get('/', (req, res) => {
  res.status(200).send('Phoney Phone API - Running on Railway.app');
});

// Health check route for monitoring - support multiple paths for Railway
app.get('/health', healthCheck);
app.get('/api/health', healthCheck);

// Health check handler
function healthCheck(req: express.Request, res: express.Response) {
  res.status(200).json({
    status: 'healthy',
    version: '0.1.0',
    timestamp: new Date().toISOString()
  });
}

/**
 * Handle incoming calls
 */
app.post('/api/incoming-call', async (req, res) => {
  console.log('=== START INCOMING CALL HANDLER ===');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  
  try {
    // Parse incoming call data
    console.log('Parsing incoming call data...');
    const callerNumber = req.body.From;
    const callSid = req.body.CallSid;
    console.log('Call from:', callerNumber, 'SID:', callSid);

    // Notify dashboard of new call
    await notifyNewCall(callSid, callerNumber);
    
    // Create TwiML response
    console.log('Creating TwiML response...');
    const twiml = new VoiceResponse();
    
    try {
      console.log('Generating welcome speech...');
      const currentPersonalityId = getCurrentPersonality();
      const personality = personalities[currentPersonalityId];
      
      // Use consistent voice settings based on current personality
      const welcomeAudio = await generateSpeech('Hello?', {
        personalityType: currentPersonalityId.toUpperCase() as any,
        gender: personality.voiceId.includes('Neural2-J') ? 'MALE' : 'FEMALE'
      });
      
      // Check if we got a direct TwiML response
      if (welcomeAudio.startsWith('<Response>')) {
        console.log('Received direct TwiML response, returning it');
        res.set('Content-Type', 'text/xml');
        return res.send(welcomeAudio);
      }

      // Otherwise, play the generated audio
      const audioUrl = formatTwilioAudio(welcomeAudio);
      console.log('Audio URL to play:', audioUrl.substring(0, 50) + '...');
      
      // Play initial hello
      twiml.play(audioUrl);
      
      // Wait 2 seconds
      twiml.pause({ length: 2 });
      
      // Follow up if no response
      const followUpAudio = await generateSpeech('Hello? Anyone there?', {
        personalityType: currentPersonalityId.toUpperCase() as any,
        gender: personality.voiceId.includes('Neural2-J') ? 'MALE' : 'FEMALE'
      });
      
      // Gather speech after follow-up
      const gather = twiml.gather({
        input: ['speech'],
        action: '/api/process-speech',
        method: 'POST',
        speechTimeout: 'auto',
        speechModel: 'phone_call',
        enhanced: true
      });
      
      gather.play(formatTwilioAudio(followUpAudio));
      
    } catch (speechError) {
      console.error('Error generating speech:', speechError);
      // Fall back to basic TTS
      twiml.say('Hello? This is an automated assistant. How can I help you today?');
      
      // Set up speech gathering
      twiml.gather({
        input: ['speech'],
        action: '/api/process-speech',
        method: 'POST',
        speechTimeout: 'auto',
        speechModel: 'phone_call',
        enhanced: true
      });
    }
    
    // Send TwiML response
    const twimlResponse = twiml.toString();
    console.log('=== END INCOMING CALL HANDLER ===');
    
    res.set('Content-Type', 'text/xml');
    return res.send(twimlResponse);
  } catch (error) {
    console.error('=== ERROR IN INCOMING CALL HANDLER ===');
    console.error('Error details:', error);
    
    // Generate simple error response
    const twiml = new VoiceResponse();
    twiml.say('I apologize, but I encountered a technical issue. Please try your call again.');
    
    res.set('Content-Type', 'text/xml');
    return res.send(twiml.toString());
  }
});

/**
 * Process speech during a call
 */
app.post('/api/process-speech', async (req, res) => {
  console.log('=== START PROCESS SPEECH HANDLER ===');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  
  try {
    // Parse form data
    const speechResult = req.body.SpeechResult;
    const callSid = req.body.CallSid;
    
    console.log('Speech result:', speechResult);
    console.log('Call SID:', callSid);
    
    if (!speechResult) {
      throw new Error('No speech result received');
    }
    
    // Get current personality
    const currentPersonalityId = getCurrentPersonality();
    const personality = personalities[currentPersonalityId];
    
    // Build prompt with examples
    const examplesText = personality.examples
      .map(ex => `User: ${ex.input}\nAssistant: ${ex.response}`)
      .join('\n\n');
    
    // Generate full prompt with personality information
    const prompt = `${personality.systemPrompt}\n\nExample conversations:\n${examplesText}\n\nCurrent conversation:\nUser: ${speechResult}\nAssistant:`;
    
    // Generate AI response
    console.log('Getting AI response...');
    const aiResponse = await generateGeminiResponse(prompt);
    console.log('AI response:', aiResponse);
    
    // Send transcription updates
    await sendTranscription(callSid, speechResult, 'user');
    await sendTranscription(callSid, aiResponse, 'ai');
    
    // Create TwiML response
    const twiml = new VoiceResponse();
    
    // Add a small pause
    twiml.pause({ length: 1 });
    
    try {
      // Generate speech with the same personality voice
      console.log('Generating TTS response...');
      const responseAudio = await generateSpeech(aiResponse, {
        personalityType: currentPersonalityId.toUpperCase() as any,
        gender: personality.voiceId.includes('Neural2-J') ? 'MALE' : 'FEMALE'
      });
      
      // Check for direct TwiML response
      if (responseAudio.startsWith('<Response>')) {
        console.log('Received direct TwiML response, returning it');
        res.set('Content-Type', 'text/xml');
        return res.send(responseAudio);
      }
      
      // Play the generated audio
      twiml.play(formatTwilioAudio(responseAudio));
    } catch (ttsError) {
      console.error('Error with TTS, falling back to basic Say:', ttsError);
      // Fall back to basic Twilio TTS
      twiml.say(aiResponse);
    }
    
    // Add a pause
    twiml.pause({ length: 1 });
    
    // Set up the next speech gathering
    twiml.gather({
      input: ['speech'],
      action: '/api/process-speech',
      method: 'POST',
      speechTimeout: 'auto',
      language: 'en-US',
      speechModel: 'phone_call',
      enhanced: true
    });
    
    // Send TwiML response
    const twimlResponse = twiml.toString();
    console.log('=== END PROCESS SPEECH HANDLER ===');
    
    res.set('Content-Type', 'text/xml');
    return res.send(twimlResponse);
  } catch (error) {
    console.error('=== ERROR IN PROCESS SPEECH HANDLER ===');
    console.error('Error details:', error);
    
    // Generate simple error response
    const twiml = new VoiceResponse();
    twiml.say('I apologize, but I encountered an error. Please try again.');
    
    // Set up speech gathering again
    twiml.gather({
      input: ['speech'],
      action: '/api/process-speech',
      method: 'POST',
      speechTimeout: 'auto'
    });
    
    res.set('Content-Type', 'text/xml');
    return res.send(twiml.toString());
  }
});

/**
 * Handle call transfers
 */
app.post('/api/transfer-call', async (req, res) => {
  console.log('=== START TRANSFER CALL HANDLER ===');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  
  try {
    // Parse form data
    const callSid = req.body.CallSid;
    const transferTo = req.body.transferTo || process.env.DEFAULT_TRANSFER_NUMBER;
    
    console.log(`Transferring call ${callSid} to ${transferTo}`);
    
    // Update call status
    await updateCallStatus(callSid, 'transferring', { transferTo });
    
    // Create TwiML for transfer
    const twiml = new VoiceResponse();
    
    try {
      // Generate hold message
      const holdAudio = await generateSpeech('Please hold while I transfer your call.', {
        personalityType: 'PROFESSIONAL',
        gender: 'MALE'
      });
      
      // Play hold message
      if (!holdAudio.startsWith('<Response>')) {
        twiml.play(formatTwilioAudio(holdAudio));
      } else {
        twiml.say('Please hold while I transfer your call.');
      }
    } catch (ttsError) {
      console.error('Error generating hold message, using fallback:', ttsError);
      twiml.say('Please hold while I transfer your call.');
    }
    
    // Add Dial verb to transfer the call
    const dial = twiml.dial({
      callerId: process.env.TWILIO_PHONE_NUMBER,
      action: '/api/transfer-complete',
      method: 'POST'
    });
    
    dial.number(transferTo);
    
    // Send TwiML response
    const twimlResponse = twiml.toString();
    console.log('Transfer TwiML:', twimlResponse);
    console.log('=== END TRANSFER CALL HANDLER ===');
    
    res.set('Content-Type', 'text/xml');
    return res.send(twimlResponse);
  } catch (error) {
    console.error('=== ERROR IN TRANSFER CALL HANDLER ===');
    console.error('Error details:', error);
    
    // Generate error response
    const twiml = new VoiceResponse();
    twiml.say('I apologize, but I encountered an error transferring your call. Please try again later.');
    
    res.set('Content-Type', 'text/xml');
    return res.send(twiml.toString());
  }
});

/**
 * Handle transfer completion
 */
app.post('/api/transfer-complete', async (req, res) => {
  const callSid = req.body.CallSid;
  const dialCallStatus = req.body.DialCallStatus;
  
  console.log(`Transfer completed for call ${callSid} with status: ${dialCallStatus}`);
  
  // Update call status
  await updateCallStatus(callSid, 'transferred', { dialCallStatus });
  
  // Create TwiML response
  const twiml = new VoiceResponse();
  
  if (dialCallStatus !== 'completed') {
    // If transfer failed, handle the call again
    twiml.say('The transfer was not completed. Returning to the assistant.');
    twiml.redirect('/api/process-speech');
  } else {
    // If transfer was successful, hang up
    twiml.hangup();
  }
  
  res.set('Content-Type', 'text/xml');
  return res.send(twiml.toString());
});

/**
 * Switch active personality
 */
app.post('/api/set-personality', (req, res) => {
  const { personalityId } = req.body;
  
  if (!personalityId || !personalities[personalityId]) {
    return res.status(400).json({ error: 'Invalid personality ID' });
  }
  
  try {
    const previousPersonality = getCurrentPersonality();
    
    // Update current personality
    require('./lib/ai-personalities').setCurrentPersonality(personalityId);
    
    console.log(`Personality switched from ${previousPersonality} to ${personalityId}`);
    
    return res.status(200).json({ 
      success: true, 
      message: 'Personality updated',
      previous: previousPersonality,
      current: personalityId
    });
  } catch (error) {
    console.error('Error updating personality:', error);
    return res.status(500).json({ error: 'Failed to update personality' });
  }
});

// Start the server
const startServer = async () => {
  try {
    // Initialize the cache system
    await initCacheSystem();
    
    // Start the Express server
    app.listen(port, () => {
      console.log(`Phoney Phone API running on port ${port}`);
      console.log(`Server started at ${new Date().toISOString()}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
