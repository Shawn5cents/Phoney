<div align="center">

<img src="docs/assets/images/phoney-logo.svg" alt="Phoney Logo" width="200"/>

# 🎭 PHONEY

### Your AI Phone Assistant with a Personality

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Google](https://img.shields.io/badge/Google-Gemini-4285F4?style=for-the-badge&logo=google)](https://deepmind.google/technologies/gemini/)
[![Google TTS](https://img.shields.io/badge/Google-TTS-4285F4?style=for-the-badge&logo=google)](https://cloud.google.com/text-to-speech)
[![Twilio](https://img.shields.io/badge/Twilio-API-F22F46?style=for-the-badge&logo=twilio)](https://www.twilio.com/)
[![Pusher](https://img.shields.io/badge/Pusher-Realtime-300D4F?style=for-the-badge&logo=pusher)](https://pusher.com/)
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
      <td>Multiple AI personalities to choose from</td>
      <td>Intelligent call handling with real-time updates</td>
      <td>Live transcription & streaming responses</td>
      <td>One-click transfer with call takeover</td>
    </tr>
  </table>
</div>

### 🎭 Multiple AI Personalities

Phoney features a range of AI personalities to handle your calls, each with their own voice and character:

<div align="center">
  <table>
    <tr>
      <td align="center">🎯 <b>Professional</b></td>
      <td align="center">😊 <b>Friendly</b></td>
      <td align="center">😄 <b>Witty</b></td>
      <td align="center">🧘 <b>Zen</b></td>
    </tr>
    <tr>
      <td>Formal and business-like</td>
      <td>Warm and approachable</td>
      <td>Clever with a sense of humor</td>
      <td>Calm and thoughtful</td>
    </tr>
    <tr>
      <td><i>Ideal for business calls</i></td>
      <td><i>Great for general use</i></td>
      <td><i>Adds entertainment</i></td>
      <td><i>Creates calming atmosphere</i></td>
    </tr>
  </table>
</div>

#### Real-time Call Management
- Live call handling with Pusher-powered real-time dashboard updates
- Streaming AI responses for natural conversation flow
- High-quality voice using Google's advanced Text-to-Speech
- Smart transfer system with one-click call control

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
        • Pusher Channels
      </td>
      <td>
        • Google Gemini Pro<br>
        • Google Cloud TTS<br>
        • Speech Recognition
      </td>
      <td>
        • Railway<br>
        • WebSockets<br>
        • Real-time Updates
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
// Example personality configuration
const professionalPersonality = {
  type: "PROFESSIONAL",
  description: "Formal and business-like assistant",
  systemPrompt: "You are Michael, a professional assistant who handles calls with formality and efficiency...",
  voiceSettings: {
    gender: "MALE",
    name: "en-US-Neural2-D"
  },
  examples: [
    {
      input: "I need to speak with Shawn directly",
      response: "I understand your request to speak with Shawn. He's currently unavailable, but as his professional assistant, I'm fully equipped to assist you."
    },
    {
      input: "When will he be available?",
      response: "I don't have his exact availability at the moment, but I can take your information and ensure he receives your message promptly."
    }
  ]
};
```

### Environment Variables

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_API_KEY_SID=your_api_key_sid
TWILIO_API_KEY_SECRET=your_api_key_secret
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Google AI Configuration
GOOGLE_API_KEY=your_google_api_key

# Pusher Configuration (for real-time updates)
PUSHER_APP_ID=your_pusher_app_id
PUSHER_KEY=your_pusher_key
PUSHER_SECRET=your_pusher_secret
PUSHER_CLUSTER=your_pusher_cluster

# Client-side Pusher Configuration
NEXT_PUBLIC_PUSHER_KEY=your_pusher_key
NEXT_PUBLIC_PUSHER_CLUSTER=your_pusher_cluster
```

## 🤝 Contributing

We welcome contributions! Check out our [Contributing Guide](https://shawn5cents.github.io/Phoney/contributing) to get started.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

<div align="center">

### Made with ❤️ by [Shawn5cents](https://github.com/Shawn5cents)

<a href="https://github.com/Shawn5cents/Phoney/stargazers">⭐ Star us on GitHub!</a>

</div>
