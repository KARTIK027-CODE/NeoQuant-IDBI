# NeoQuant — IDBI AI Wealth Advisor

An AI-powered wealth advisory platform for IDBI Bank, featuring ARIA — a conversational AI advisor with voice capabilities and multilingual support.

## Tech Stack
- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **AI**: Mock LLM (designed for AWS Bedrock Claude 3.5 Sonnet in production)
- **Voice**: Web Speech API (STT + TTS) — 9 Indian languages
- **Security**: JWT Auth, CORS, Rate Limiting, Helmet, Input Validation

## Features
- ARIA AI Avatar — photorealistic video-call style interface
- Multilingual voice input: English, Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam
- Portfolio tracking and analysis
- SIP management and recommendations
- SEBI-compliant financial advice
- Tax planning insights
- Relationship Manager escalation

## Architecture
```
├── frontend/          # React + Vite app
│   ├── src/
│   │   ├── screens/   # Login, Portfolio, Chat
│   │   ├── components/# Avatar, shared components
│   │   └── index.css  # Design system tokens
├── backend/           # Node.js Express API
│   ├── routes/        # Auth, Chat, Portfolio
│   ├── services/      # LLM service, mock data
│   ├── middleware/    # JWT, rate limiting, validators
│   └── data/          # Mock portfolio data
```

## Security
- JWT authentication on all protected routes
- CORS restricted to frontend origin
- Rate limiting: 100 req/15min general, 20 req/15min for chat
- Input validation and sanitization
- XSS-safe markdown rendering
- Helmet security headers

## Production Note
This prototype uses mock LLM responses. Production version is designed for:
- AWS Bedrock (Claude 3.5 Sonnet) — aligned with IDBI's AWS knowledge partner
- Google DeepMind Live Avatar API for real-time avatar animation
- PostgreSQL for persistent conversation memory

## Team
Built for IDBI Bank Hackathon 2026
