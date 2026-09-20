<div align="center">
  <img src="https://img.icons8.com/color/96/000000/microphone.png" alt="ExpeVoice Logo" width="80" height="80">
  
  # ExpeVoice 🎙️💸
  
  **AI-Powered Voice Expense Tracker**
  
  [![React](https://img.shields.io/badge/React-19-blue.svg?style=flat&logo=react)](https://reactjs.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-Backend-green.svg?style=flat&logo=nodedotjs)](https://nodejs.org/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248.svg?style=flat&logo=mongodb)](https://www.mongodb.com/)
  [![Google Gemini](https://img.shields.io/badge/AI-Google_Gemini-orange.svg?style=flat&logo=google)](https://deepmind.google/technologies/gemini/)
  [![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC.svg?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
</div>

---

**ExpeVoice** is a modern, full-stack expense tracking application that lets you log your expenses using natural language voice commands. Powered by Google Gemini AI, it automatically categorizes and structures your spending while keeping everything in sync across devices using MongoDB.

## ✨ Features

- **🎙️ Voice-Powered Logging**: Simply speak your expense (e.g., *"I spent $15 on coffee this morning"*) and Gemini AI will automatically extract the amount, category, and date.
- **🔐 Secure Authentication**: One-tap Google Sign-In integration for secure user management.
- **☁️ Cloud Sync & Offline Mode**: Real-time synchronization with MongoDB, backed by a robust offline cache that syncs automatically when you regain connection.
- **💱 Multi-Currency Support**: Live exchange rates allowing you to travel and spend globally while tracking against your home currency.
- **📊 Smart Budgets**: Set custom monthly category budgets and get visual alerts when you approach your limits.
- **📄 Export Reports**: Instantly export your structured financial data as beautiful PDF or CSV reports.

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS 4, Framer Motion
- **Backend**: Node.js, Express
- **Database**: MongoDB Atlas
- **AI & Processing**: Google Gemini API
- **Deployment**: Docker-ready, Render Blueprint included

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js (v18 or higher)
- MongoDB Atlas cluster (or local instance)
- Google Cloud Console (OAuth Client ID)
- Google Gemini API Key

### 1. Clone the repository
```bash
git clone https://github.com/Sumeet010/ExpeVoice.git
cd ExpeVoice
```

### 2. Environment Variables
Create a `.env` file in the root directory based on `.env.example`:
```env
PORT=3000
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB_NAME=voice_expense_tracker
GEMINI_API_KEY=your_gemini_api_key
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run the App
```bash
npm run dev
```
The application will start concurrently on `http://localhost:3000`.

## ☁️ Deployment (Render)

This project is configured with a `render.yaml` Blueprint and a `Dockerfile` for instantaneous deployment on Render.

1. Go to your **Render Dashboard**.
2. Click **New -> Blueprint**.
3. Connect your repository.
4. Add your secrets (`MONGODB_URI`, `GEMINI_API_KEY`, `VITE_GOOGLE_CLIENT_ID`) in the Environment tab.
5. Deploy!

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/Sumeet010/ExpeVoice/issues).

## 📝 License

This project is open-source and available under the [MIT License](LICENSE).
