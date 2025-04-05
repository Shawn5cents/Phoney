// Amazon Connect integration configuration and utilities
import { personalityStore } from '@/lib/personality-store';

export interface AmazonConnectConfig {
  instanceId: string;
  contactFlowId: string;
  connectEndpoint: string;
  region: string;
  sipDomain?: string;
  useSipTrunking: boolean;
}

// Default configuration - should be overridden by environment variables
export const amazonConnectConfig: AmazonConnectConfig = {
  instanceId: process.env.AMAZON_CONNECT_INSTANCE_ID || 'your-instance-id',
  contactFlowId: process.env.AMAZON_CONNECT_FLOW_ID || 'your-contact-flow-id',
  connectEndpoint: process.env.AMAZON_CONNECT_ENDPOINT || '+15551234567',
  region: process.env.AMAZON_CONNECT_REGION || 'us-east-1',
  sipDomain: process.env.AMAZON_CONNECT_SIP_DOMAIN,
  useSipTrunking: process.env.AMAZON_CONNECT_USE_SIP === 'true'
};

// Helper function to generate SIP URI for Amazon Connect
export function generateSipUri(callerNumber: string): string {
  if (!amazonConnectConfig.sipDomain) {
    throw new Error('SIP domain not configured for Amazon Connect');
  }
  
  // Format: sip:instanceId@sipDomain
  return `sip:${amazonConnectConfig.instanceId}@${amazonConnectConfig.sipDomain}`;
}

// Helper function to pass personality information to Amazon Connect
export function getPersonalityMetadata() {
  const currentPersonality = personalityStore.getCurrentPersonality();
  
  return {
    personalityId: currentPersonality.name.toLowerCase(),
    personalityName: currentPersonality.name,
    personalityTraits: currentPersonality.traits.join(',')
  };
}

// Helper function to format call metadata for Amazon Connect
export function formatCallMetadata(callSid: string, callerNumber: string) {
  const personalityInfo = getPersonalityMetadata();
  
  return {
    callSid,
    callerNumber,
    ...personalityInfo,
    timestamp: new Date().toISOString()
  };
}
