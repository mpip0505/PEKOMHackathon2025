# 🔥 DalCo - Data-Link Co-pilot (Firebase Edition)

AI-powered chatbot to automate data entry from customer messages directly into Google Sheets.

**Reduces admin work from 16 hours/week to just 30 minutes!**

---

## 🎯 What is DalCo?

DalCo helps Malaysian SMEs automate repetitive tasks:
- ✅ Auto-process WhatsApp, Instagram, Email messages
- ✅ Extract customer data using AI (JamAI Base)
- ✅ Auto-fill Google Sheets
- ✅ Bilingual support (Bahasa Malaysia & English)
- ✅ Real-time updates with Firebase

---

## 🛠 Tech Stack

- **Backend:** Node.js + Express.js
- **Database:** Firebase Firestore
- **Auth:** Firebase Authentication
- **Storage:** Firebase Storage
- **AI:** JamAI Base
- **Hosting:** Firebase Hosting + Cloud Functions

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

Edit `.env`:

```bash
NODE_ENV=development
PORT=5000

# Path to your Firebase service account key
FIREBASE_SERVICE_ACCOUNT_PATH=./dalco-hackathon-firebase-adminsdk.json

# JamAI Base
JAMAI_API_KEY=your-jamai-key

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
│   │   └── firebase.js          # Firebase initialization
│   ├── routes/
│   │   ├── auth.routes.js       # Authentication
│   │   ├── messages.routes.js   # Message processing
│   │   ├── leads.routes.js      # Lead management
│   │   └── analytics.routes.js  # Dashboard stats
│   ├── controllers/             # Request handlers
│   ├── services/                # Business logic
│   ├── middleware/              # Auth, validation
│   ├── utils/
│   │   └── logger.js           # Winston logger
│   └── server.js               # Main entry point
├── docs/
│   └── swagger.yaml            # API documentation
├── dalco-hackathon-firebase-adminsdk.json  # KEEP SECRET!
├── .env                        # Your config
├── .gitignore
├── package.json
└── README.md
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

### messages
```javascript
{
  id: "msg_123",
  organizationId: "org_123",
  channelType: "whatsapp",
  channelId: "channel_123",
  direction: "inbound",
  from: "+60123456789",
  content: "Saya nak buat appointment",
  parsedData: {
    intent: "booking",
    entities: {...},
    language: "bm"
  },
  status: "processed",
  timestamp: Timestamp
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

## 📖 API Endpoints

### Authentication
- `POST /api/auth/verify` - Verify Firebase ID token
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Messages
- `GET /api/messages` - List messages
- `POST /api/messages/process` - Process new message
- `GET /api/messages/:id` - Get message details

### Leads
- `GET /api/leads` - List leads
- `POST /api/leads` - Create lead
- `PUT /api/leads/:id` - Update lead

### Analytics
- `GET /api/analytics/overview` - Dashboard stats

---

## 🧪 Testing

### Test Firebase Connection

```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "success": true,
  "status": "healthy",
  "services": {
    "api": "running",
    "firestore": "connected"
  }
}
```

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

**Built with ❤️ and 🔥 Firebase for Malaysian SMEs**
