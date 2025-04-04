<div align="center">

<img src="docs/assets/images/phoney-logo.svg" alt="Phoney Logo" width="200"/>

# 🎭 PHONEY

### Your AI Phone Assistant with a Personality

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Google](https://img.shields.io/badge/Google-Gemini-4285F4?style=for-the-badge&logo=google)](https://deepmind.google/technologies/gemini/)
[![Unreal Speech](https://img.shields.io/badge/Unreal-Speech-FF4088?style=for-the-badge&logo=unrealengine)](https://unrealspeech.com/)
[![Twilio](https://img.shields.io/badge/Twilio-API-F22F46?style=for-the-badge&logo=twilio)](https://www.twilio.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

</div>

<div align="center">
  <h3>🎭 Give Your Phone Line a Personality 🎭</h3>
  <h4>Transform your phone system with an AI assistant that's more than just a voice - it's a character!</h4>
</div>

---

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-demo">Demo</a> •
  <a href="#-documentation">Documentation</a> •
  <a href="#-contributing">Contributing</a>
</p>

---

## 🌟 Features

<div align="center">
  <table>
    <tr>
      <td align="center">🎭 <b>Personality AI</b></td>
      <td align="center">🎯 <b>Smart Routing</b></td>
      <td align="center">🔄 <b>Real-time</b></td>
      <td align="center">🎛️ <b>Control</b></td>
    </tr>
    <tr>
      <td>Meet Tre, your personal AI assistant</td>
      <td>Intelligent call handling with auto-recording</td>
      <td>Live transcription & call recording</td>
      <td>One-click transfer with default number</td>
    </tr>
  </table>
</div>

### 🎭 Meet Tre - Your Personal AI Assistant

Phoney features Tre, a sophisticated personal assistant designed to handle your calls with professionalism and warmth:

<div align="center">
  <table>
    <tr>
      <td align="center">🎯 <b>Natural Interaction</b></td>
      <td align="center">📝 <b>Call Management</b></td>
      <td align="center">🔄 <b>Smart Transfer</b></td>
      <td align="center">🎙️ <b>Voice Quality</b></td>
    </tr>
    <tr>
      <td>Professional yet warm</td>
      <td>Auto-recording & transcription</td>
      <td>Default number ready</td>
      <td>Premium Jasper voice</td>
    </tr>
    <tr>
      <td><i>Natural conversations</i></td>
      <td><i>Never miss a detail</i></td>
      <td><i>Seamless transfers</i></td>
      <td><i>Crystal clear audio</i></td>
    </tr>
  </table>
</div>

#### Call Recording & Management
- Automatic call recording for every conversation
- Live transcription with real-time dashboard updates
- High-quality voice using Unreal Speech's Jasper voice
- Smart transfer system with configurable default number (334-352-9695)

## 🚀 Quick Start

```bash
# Clone the repo
git clone https://github.com/Shawn5cents/Phoney.git

# Install dependencies
npm install

# Set up environment
cp .env.example .env

# Launch
npm run dev
```

## 🎮 Demo

<div align="center">
  <img src="docs/assets/images/demo.svg" alt="Phoney Demo" width="600"/>
</div>

## 🛠️ Tech Stack

<div align="center">
  <table>
    <tr>
      <td align="center"><b>Frontend</b></td>
      <td align="center"><b>Backend</b></td>
      <td align="center"><b>AI/ML</b></td>
      <td align="center"><b>Infrastructure</b></td>
    </tr>
    <tr>
      <td>
        • Next.js 14<br>
        • TypeScript<br>
        • Tailwind CSS
      </td>
      <td>
        • Next.js API Routes<br>
        • Twilio SDK<br>
        • Pusher
      </td>
      <td>
        • Google Gemini Pro<br>
        • Google Cloud TTS<br>
        • Neural Voice Models
      </td>
      <td>
        • Vercel/Railway<br>
        • PostgreSQL<br>
        • Redis Cache
      </td>
    </tr>
  </table>
</div>

## 📚 Documentation

- [Getting Started Guide](https://shawn5cents.github.io/Phoney/getting-started)
- [API Reference](https://shawn5cents.github.io/Phoney/api-reference)
- [Architecture Overview](https://shawn5cents.github.io/Phoney/architecture)
- [Deployment Guide](https://shawn5cents.github.io/Phoney/deployment)
- [Personality Configuration](https://shawn5cents.github.io/Phoney/personality-config)

### Configuring AI Personalities

```typescript
// Tre's personality configuration
const trePersonality = {
  name: "Tre",
  description: "Professional personal assistant",
  systemPrompt: `You are Tre, Shawn's personal assistant. Be professional but warm...",
  voice: "Jasper", // Uses Unreal Speech's premium voice
  traits: ["Professional", "Warm", "Efficient"],
  examples: [
    {
      input: "I need to speak with Shawn directly",
      response: "I understand you'd like to speak with Shawn, but he's asked me to handle all his calls. I'm his personal assistant Tre, and I can definitely help you with whatever you need."
    }
  ]
};
```

### Environment Variables

```env
# AI Configuration
GEMINI_API_KEY=your_gemini_key

# Voice Configuration
UNREAL_SPEECH_API_KEY=your_unreal_speech_key

# Twilio Configuration
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_phone_number

# Pusher Configuration (for real-time updates)
PUSHER_APP_ID=your_app_id
PUSHER_KEY=your_key
PUSHER_SECRET=your_secret
PUSHER_CLUSTER=your_cluster

# Transfer Configuration
DEFAULT_TRANSFER_NUMBER=334-352-9695
```

## 🤝 Contributing

We welcome contributions! Check out our [Contributing Guide](https://shawn5cents.github.io/Phoney/contributing) to get started.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

<div align="center">

### Made with ❤️ by [Shawn5cents](https://github.com/Shawn5cents)

<a href="https://github.com/Shawn5cents/Phoney/stargazers">⭐ Star us on GitHub!</a>

</div>
