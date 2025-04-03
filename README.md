<div align="center">

<img src="docs/assets/images/phoney-logo.svg" alt="Phoney Logo" width="200"/>

# 🎭 PHONEY

### Your AI Phone Assistant with a Personality

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4-412991?style=for-the-badge&logo=openai)](https://openai.com/)
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
      <td>Custom AI personas for your business</td>
      <td>Intelligent call handling & forwarding</td>
      <td>Live transcription & monitoring</td>
      <td>Instant human takeover capability</td>
    </tr>
  </table>
</div>

### 🎭 AI Personalities

Phoney comes with four distinct AI personalities, each designed for different business needs:

<div align="center">
  <table>
    <tr>
      <td align="center">👔 <b>Professional</b></td>
      <td align="center">😊 <b>Friendly</b></td>
      <td align="center">😄 <b>Witty</b></td>
      <td align="center">🧘 <b>Zen</b></td>
    </tr>
    <tr>
      <td>Business-focused, efficient</td>
      <td>Warm and approachable</td>
      <td>Clever with light humor</td>
      <td>Calm and mindful</td>
    </tr>
    <tr>
      <td><i>Perfect for corporate</i></td>
      <td><i>Great for customer service</i></td>
      <td><i>Ideal for casual brands</i></td>
      <td><i>Suited for wellness</i></td>
    </tr>
  </table>
</div>

#### Real-time Personality Switching
- Switch personalities instantly from the dashboard
- Each personality comes with unique voice settings
- Customized conversation examples for consistent tone
- Personality-specific prompts for authentic interactions

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
        • OpenAI GPT-4<br>
        • ElevenLabs Voice<br>
        • Custom ML Models
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
// Example personality configuration
const customPersonality = {
  name: "Customer Service",
  description: "Helpful retail assistant",
  systemPrompt: `You are a retail assistant...",
  voiceId: "en-US-JennyNeural",
  traits: ["Helpful", "Patient", "Knowledgeable"],
  examples: [
    {
      input: "Do you have this in blue?",
      response: "Let me check our inventory for you."
    }
  ]
};
```

### Environment Variables

```env
# AI Configuration
OPENAI_API_KEY=your_openai_key
ELEVENLABS_API_KEY=your_elevenlabs_key

# Twilio Configuration
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_phone_number

# Pusher Configuration (for real-time updates)
PUSHER_APP_ID=your_app_id
PUSHER_KEY=your_key
PUSHER_SECRET=your_secret
PUSHER_CLUSTER=your_cluster
```

## 🤝 Contributing

We welcome contributions! Check out our [Contributing Guide](https://shawn5cents.github.io/Phoney/contributing) to get started.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

<div align="center">

### Made with ❤️ by [Shawn5cents](https://github.com/Shawn5cents)

<a href="https://github.com/Shawn5cents/Phoney/stargazers">⭐ Star us on GitHub!</a>

</div>
