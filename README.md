# CampaignIQ — AI-Native Mini CRM

## Live Demo
[URL Placeholder] | [Video Walkthrough Placeholder]

## What I Built
CampaignIQ is a chat-first, AI-assisted Mini CRM designed for D2C brands. Instead of a traditional point-and-click segment builder, it introduces an AI chat panel as the primary interface. Marketers can type what they want (e.g., "win back customers from Mumbai who haven't ordered in 90 days"), and the AI instantly generates the segment rules and drafts personalized campaign messages. It completely flips the CRM workflow from manual configuration to natural language orchestration.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)               │
└────────────────────────┬────────────────────────────────┘
                         │ REST API
┌────────────────────────▼────────────────────────────────┐
│                  CRM BACKEND (Node.js + Express)         │
│  ┌──────────────┐   ┌────────────────┐                  │
│  │  MongoDB     │   │  Groq API      │                  │
│  │  (data store)│   │  (LLM calls)   │                  │
│  └──────────────┘   └────────────────┘                  │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP POST (send job)
┌────────────────────────▼────────────────────────────────┐
│              CHANNEL SERVICE (Node.js + Express)         │
└─────────────────────────────────────────────────────────┘
```

- **Frontend**: A React application using Vite and TailwindCSS. It provides the dashboard, data tables, and the crucial floating AI Chat Panel.
- **CRM Backend**: An Express server handling REST API requests, communicating with MongoDB for persistence, and interfacing with the Groq API (llama-3.3-70b-versatile) for natural language processing.
- **Channel Service**: A separate mock service that receives campaign dispatch jobs and simulates delivery lifecycles (Delivered, Opened, Clicked, Failed), sending webhooks back to the CRM backend to update stats atomically.

## AI Features
- **Segment Builder (NL → MongoDB query)**: The AI parses natural language into a structured JSON rule engine, which the backend translates into a MongoDB aggregation query.
- **Message Drafter (3 variations)**: The AI generates multiple personalized, channel-appropriate message options based on the segment context and desired tone.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + TailwindCSS |
| Backend (CRM) | Node.js + Express.js |
| Database | MongoDB Atlas (Free Tier) |
| AI / LLM | Groq API (llama-3.3-70b-versatile) |
| Channel Service | Node.js + Express.js |

## Running Locally

1. **Clone the repository.**
2. **Start the Channel Service**:
   ```bash
   cd channel-service
   npm install
   npm start
   ```
   (Runs on port 5001 by default).
3. **Start the CRM Backend**:
   - Create a `.env` file in `backend/` with `MONGODB_URI` and `GROQ_API_KEY`.
   ```bash
   cd backend
   npm install
   node seed.js # To populate dummy data
   npm start
   ```
   (Runs on port 5000 by default).
4. **Start the Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Architecture decisions & tradeoffs

**1. Why MongoDB over PostgreSQL**
I chose MongoDB because marketing segments require a highly flexible, dynamic schema for customer attributes. Rather than dealing with rigid SQL tables and expensive JOINs for arbitrary tags or order histories, I structured the segment rules as dynamic JSON that instantly translates into MongoDB's powerful aggregation pipeline. This allows the AI to dream up completely new filtering criteria without requiring backend schema migrations.

**2. Why Groq over OpenAI**
The core UX of CampaignIQ relies on a real-time, chat-first interface where the user expects instantaneous feedback. I selected the Groq API running `llama-3.3-70b-versatile` because its LPU inference engine provides sub-second latency, making the NL-to-JSON parsing feel immediate. Additionally, Groq's generous free tier perfectly matched the constraints of this assignment without sacrificing the reasoning capabilities of a 70B parameter model.

**3. Why a separate channel service**
I explicitly decoupled the delivery simulator into a standalone Express application rather than running it inline within the CRM backend. This mirrors the real-world architecture of integrating with third-party vendors like Twilio or MSG91, forcing me to handle asynchronous network calls and idempotent webhook callbacks. It proves the CRM can reliably track state across distributed systems rather than cheating with local memory updates.

**4. Why no message queue**
For the scope of this assignment, the backend dispatches messages directly to the channel service and returns a `202 Accepted` response. At a scale of 10,000 concurrent campaign sends, this synchronous HTTP dispatch would bottleneck the Node event loop and immediately overwhelm the downstream channel service with a thundering herd. A production environment would require a robust message broker like BullMQ or Redis Streams to handle rate limiting, backpressure, and guaranteed retries.

**5. What I explicitly chose NOT to build**
I deliberately omitted real authentication, multi-tenant workspace isolation, and live channel API integrations to focus entirely on the core AI routing and database aggregation logic. Furthermore, I simulated order attribution rather than building a full pixel-tracking system because the assignment's goal was to prove the data pipeline and AI orchestration. Building those out would have consumed time on boilerplate features that don't demonstrate core engineering competency for this specific spec.

**6. Scale ceiling of this implementation**
This architecture will begin to fracture around 5-10 concurrent active campaigns due to the aggressive 5-second HTTP polling I implemented on the frontend instead of WebSockets. At the database layer, the dynamic segment aggregation queries currently lack heavily optimized compound indexes. If the database scales past 100K+ customers with deep order histories, the segment engine will trigger full collection scans that will severely degrade API response times.

## What I'd Build Next
- **Advanced Authentication**: Implement JWT-based auth and multi-tenancy to support multiple brands using the platform securely.
- **Visual Rule Builder fallback**: While the AI is powerful, a visual drag-and-drop rule builder should be available as a fallback for highly complex or specific edge-case segments.
- **A/B Testing Automation**: Allow the AI to automatically split a segment and launch A/B tests using different generated message variations, then automatically scale the winning message.
