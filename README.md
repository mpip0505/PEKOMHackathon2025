# 🔥 DalCo - Data-Link Co-pilot (Firebase + JamAI Base Edition)

AI-powered WhatsApp chatbot + internal co-pilot that automates order taking, FAQ responses, inventory checks, and dashboard insights for Malaysian SME wholesalers.

**Reduces admin work from 16 hours/week to just 30 minutes!**

---

## 🎯 What is DalCo?

DalCo helps Malaysian SMEs automate repetitive tasks:
- ✅ Auto-process WhatsApp, Instagram, Email messages
- ✅ Extract customer data using AI (JamAI Base Action + Generative tables)
- ✅ Answer FAQs + inventory queries with JamAI Knowledge tables (BM & English)
- ✅ Auto-fill Google Sheets (orders + stock levels)
- ✅ Provide SME dashboard with JamAI-powered insights
- ✅ Real-time logs with Firebase

---

## 🧱 Architecture Overview

| Layer | Tech | Purpose |
|-------|------|---------|
| Channel | WhatsApp Webhook (Express route) | Customer chatbot that can answer FAQs, check inventory, and capture orders |
| AI Brain | JamAI Base (Action, Knowledge, Generative tables) | Intent detection, RAG for FAQ, order/inventory extraction, and analytics summaries |
| Data | Google Sheets | `Inventory` tab (SKU, colour, size, stock) + `Orders` tab (timestamped orders) |
| Automation | Firebase Functions-ready Express backend | Persists chat logs, exposes APIs, auto logs orders into Google Sheets |
| Dashboard | `/dashboard` static UI | Shows total sales, top SKU, recent orders + “AI Analyse” button backed by JamAI Base |

> 🗂️ Keep JamAI Base table IDs in `.env` so you can swap datasets between hackathon demos without touching code.

---

## 🛠 Tech Stack

- **Backend:** Node.js + Express.js
- **Realtime Store:** Firebase Firestore
- **Auth:** Firebase Authentication
- **AI Orchestration:** JamAI Base (Action, Knowledge, Generative tables)
- **Sheets Automation:** Google Sheets API
- **Frontend:** Lightweight dashboard (`/dashboard`) powered by Fetch + vanilla JS
- **Hosting target:** Firebase Hosting + Cloud Functions

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create project: "dalco-hackathon"
3. Enable Firestore Database (test mode)
4. Enable Authentication (Google provider)
5. Download service account key:
   - Project Settings → Service Accounts
   - Generate New Private Key
   - Save as `dalco-hackathon-firebase-adminsdk.json` in project root

### 3. Configure Environment

```bash
cp .env.example .env
```

Add the following variables:

```bash
NODE_ENV=development
PORT=5000

# Firebase Admin
FIREBASE_SERVICE_ACCOUNT_PATH=./dalco-hackathon-firebase-adminsdk.json

# JamAI Base (replace with your table IDs)
JAMAI_API_KEY=your-jamai-key
JAMAI_BASE_URL=https://api.jamaibase.com/v1
JAMAI_INTENT_ACTION_TABLE_ID=tbl_intent
JAMAI_FAQ_KNOWLEDGE_TABLE_ID=tbl_faq
JAMAI_INVENTORY_ACTION_TABLE_ID=tbl_inventory_parser
JAMAI_ORDER_ACTION_TABLE_ID=tbl_order_structurer
JAMAI_ANALYTICS_GENERATIVE_TABLE_ID=tbl_sales_insights

# Google Sheets (Service Account must have edit access)
GOOGLE_SERVICE_ACCOUNT_EMAIL=service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nabc...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEETS_SPREADSHEET_ID=1xxxxxxxxxxxx
GOOGLE_SHEETS_INVENTORY_RANGE=Inventory!A2:F
GOOGLE_SHEETS_ORDER_RANGE=Orders!A2:G

# Frontend
FRONTEND_URL=http://localhost:3000
```

### 4. Run the Server

```bash
npm run dev
```

Visit:
- **API:** http://localhost:5000
- **Health Check:** http://localhost:5000/api/health
- **Docs:** http://localhost:5000/api/docs

---

## 📁 Project Structure

```
dalco-backend-firebase/
├── src/
│   ├── config/
│   │   └── firebase.js
│   ├── controllers/
│   │   ├── analytics.controller.js
│   │   ├── auth.controller.js
│   │   ├── leads.controller.js
│   │   └── messages.controller.js
│   ├── routes/
│   │   ├── analytics.routes.js
│   │   ├── auth.routes.js
│   │   ├── leads.routes.js
│   │   └── messages.routes.js
│   ├── services/
│   │   ├── googleSheets.service.js  # Inventory + order log helper
│   │   └── jamai.service.js         # JamAI Base wrappers
│   ├── utils/
│   │   └── logger.js
│   └── server.js
├── public/
│   └── dashboard.html               # SME owner dashboard UI
└── docs/
    └── swagger.yaml (optional)
```

---

## 🔥 Firebase Collections Structure

### users
```javascript
{
  uid: "firebase-user-id",
  email: "user@example.com",
  displayName: "Ahmad Ibrahim",
  photoURL: "https://...",
  organizationId: "org_123",
  role: "owner",
  languagePreference: "bm",
  createdAt: Timestamp,
  lastLogin: Timestamp
}
```

### organizations
```javascript
{
  id: "org_123",
  name: "Klinik Sehat",
  industry: "Healthcare",
  ownerId: "user_id",
  settings: {
    timezone: "Asia/Kuala_Lumpur",
    businessHours: {...}
  },
  createdAt: Timestamp
}
```

### messages (auto-logged from WhatsApp webhook)
```javascript
{
  channel: "whatsapp",
  direction: "inbound" | "outbound",
  from: "+60123456789",
  to: "+6012...",
  content: "Ada stok tak untuk 50 helai t-shirt biru size L?",
  intent: "inventory",
  metadata: {...}, // includes JamAI parsed entities or Google Sheets results
  locale: "ms",
  status: "sent",
  createdAt: Timestamp
}
```

### leads
```javascript
{
  id: "lead_123",
  organizationId: "org_123",
  sourceMessageId: "msg_123",
  customerName: "Siti Aminah",
  phone: "+60123456789",
  email: "siti@example.com",
  status: "new",
  score: 85,
  createdAt: Timestamp
}
```

---

## 🔐 Firebase Authentication

### Login with Firebase Auth

```javascript
// Client-side (Frontend)
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

const auth = getAuth();
const provider = new GoogleAuthProvider();

signInWithPopup(auth, provider)
  .then((result) => {
    const user = result.user;
    const idToken = await user.getIdToken();
    
    // Send idToken to your backend
    fetch('http://localhost:5000/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken })
    });
  });
```

### Verify Token on Backend

```javascript
// Server-side (Backend)
const { auth } = require('./config/firebase');

const verifyToken = async (idToken) => {
  const decodedToken = await auth.verifyIdToken(idToken);
  return decodedToken; // Contains uid, email, etc.
};
```

---

## 📖 API Endpoints (POC)

| Endpoint | Description |
|----------|-------------|
| `POST /api/auth/verify` | Verify Firebase ID token |
| `POST /api/messages/whatsapp` | Mock WhatsApp webhook entry point |
| `GET /api/leads` | Fetch latest structured leads (from Firestore logs) |
| `POST /api/leads` | Manually register a lead |
| `GET /api/analytics/overview` | Pulls Google Sheets metrics for dashboard |
| `POST /api/analytics/insights` | Calls JamAI Base Generative table for trend summary |
| `GET /api/system/status?deep=true` | Returns env/config report and (optional) live service checks |
| `GET /dashboard` | Lightweight SME owner UI (uses above APIs) |

---

## 🧪 Testing

### 1. Health check
```bash
curl http://localhost:5000/api/health
```

### 2. Simulate WhatsApp message
```bash
curl -X POST http://localhost:5000/api/messages/whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hi, ada stok 50 blue tee L?",
    "phoneNumber": "+60123456789",
    "displayName": "Encik Ali"
  }'
```

### 3. Dashboard
Visit `http://localhost:5000/dashboard` and click **Ask JamAI Base** to generate AI analysis of sheet data.

---

## 🐛 Troubleshooting

### Error: "Firebase service account not found"

```bash
# Make sure the file exists
ls -la dalco-hackathon-firebase-adminsdk.json

# Check .env path is correct
FIREBASE_SERVICE_ACCOUNT_PATH=./dalco-hackathon-firebase-adminsdk.json
```

### Error: "Permission denied"

In Firebase Console:
1. Firestore → Rules
2. Change to test mode:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;  // For hackathon only!
    }
  }
}
```

### Error: "Port 5000 already in use"

```bash
# Kill the process
npx kill-port 5000

# Or change port
PORT=5001 npm run dev
```

---

## 🚢 Deployment (Firebase Hosting)

### 1. Install Firebase CLI

```bash
npm install -g firebase-tools
firebase login
```

### 2. Initialize Firebase

```bash
firebase init

# Select:
# - Hosting
# - Functions (for backend)
# - Firestore
```

### 3. Deploy

```bash
# Deploy everything
firebase deploy

# Deploy functions only
firebase deploy --only functions

# Deploy hosting only
firebase deploy --only hosting
```

---

## 📚 Useful Commands

```bash
# Development
npm run dev

# Production
npm start

# Deploy to Firebase
npm run deploy

# View logs
firebase functions:log
```

---

## 🌟 Firebase Advantages

| Feature | Benefit |
|---------|---------|
| **Real-time** | Instant updates across all clients |
| **Scalability** | Auto-scales with usage |
| **Security** | Built-in security rules |
| **Authentication** | Google, Email, Phone built-in |
| **Offline** | Works offline, syncs when online |
| **Free Tier** | 1GB storage, 10GB bandwidth/month |

---

## 🔗 Resources

- **Firebase Console:** https://console.firebase.google.com/
- **Firebase Docs:** https://firebase.google.com/docs
- **Firestore Guide:** https://firebase.google.com/docs/firestore
- **JamAI Base:** https://jamaibase.com/

---

## 📞 Support

- **Issues:** Create GitHub issue
- **Docs:** http://localhost:5000/api/docs
- **Team Contact:** your-email@example.com

---

**Built with ❤️ and 🔥 Firebase + JamAI Base for Malaysian SMEs**
