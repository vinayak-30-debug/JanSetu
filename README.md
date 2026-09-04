# JanSetu 🌍 — Bharat Benefits Navigator (BBN)

**Closing the "Discovery to Accessibility" gap in Indian government welfare schemes — using AI-driven reasoning, predictive analytics, and an inclusion-first design.**

[![Status](https://img.shields.io/badge/status-hackathon--ready-brightgreen)](#)
[![Python](https://img.shields.io/badge/backend-FastAPI%20%7C%20Python%203.12-009688)](#)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## 🚩 The Problem

Millions of eligible citizens miss out on government welfare schemes every year — not because the schemes don't exist, but because:
- Eligibility rules are buried in dense legal/policy language
- There's no single place to check eligibility across state + central schemes
- Low digital literacy and rural/elderly users are locked out of complex web portals
- Even when eligible, applicants don't know which documents they're missing

**JanSetu (BBN)** solves this discovery-to-accessibility gap end-to-end: from eligibility detection to a "ready-to-apply" checklist.

## ✨ Key Features

- 🧠 **Multi-LLM Intelligence Core** — Google Gemini handles real-time intent detection and routes queries to the right welfare category; OpenRouter's GPT-OSS-120B acts as a deep-reasoning layer that deliberates over eligibility rules (age, income, occupation, state) and exposes its reasoning for full transparency.
- 🪪 **Nationwide Citizen Registry** — a synthetic database of 3,601 citizens across all 36 Indian states/UTs, with secure Aadhaar-based lookup that auto-populates a user's profile to eliminate form-filling friction.
- ♿ **Inclusion & Accessibility Layer** — a Pathway Detector distinguishes between "Citizen Direct" and "Assisted Mode" users, simplifying government jargon into icon-driven steps for rural and elderly citizens with low digital literacy.
- 📊 **Predictive ML Suite** — a RandomForest-based Success Predictor (scikit-learn) forecasts approval likelihood, and an Economic Impact Forecaster estimates the socio-economic "uplift" a scheme would provide to a given individual.
- 📋 **Ready-to-Apply (RTA) Ecosystem** — combines eligibility, document readiness, and optimization data into a unique BBN Case ID with an auto-generated missing-document checklist, ready to take to a MeeSeva center.

## 🧑‍🌾 Example: The Hero Journey

> Rohit Nair, a 65-year-old farmer from Kerala, can't navigate complex web portals.
>
> 1. BBN detects his senior status and switches to **Assisted Mode**.
> 2. The reasoning engine evaluates: *"User age 65 > limit 60. Occupation: Farmer. Conclusion: Eligible for PM-KISAN."*
> 3. Instead of legal text, Rohit sees: **✅ "You are eligible for ₹6,000 yearly income support."**
> 4. BBN predicts an **88% success rate** and hands him a 3-step action plan for his nearest center.

## 🏗️ Architecture

```
┌────────────────────┐      ┌──────────────────────────┐      ┌───────────────────────┐
│   Frontend (Web)    │◄────►│   FastAPI Backend (Py3.12) │◄──►│   Citizen Registry DB   │
│  User / Assisted UI │      │  Multi-Agent Orchestration │     │  MongoDB (3,601 users)  │
└────────────────────┘      └──────────────┬────────────┘      └───────────────────────┘
                                            │
                    ┌───────────────────────┼────────────────────────┐
                    ▼                       ▼                        ▼
          ┌──────────────────┐   ┌─────────────────────┐   ┌─────────────────────┐
          │  Google Gemini     │   │ OpenRouter GPT-OSS-120B│   │  Scikit-Learn Models │
          │  Intent & Routing   │   │  Deep Eligibility Reasoning│   │ Approval / Uplift    │
          └──────────────────┘   └─────────────────────┘   └─────────────────────┘
                                            │
                                            ▼
                                 ┌─────────────────────┐
                                 │  FAISS Vector Search  │
                                 │   (Policy Documents)  │
                                 └─────────────────────┘
```

**Pipeline:** Identity → Eligibility → Prediction → Inclusion

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI (Python 3.12) |
| LLMs | Google Gemini (intent/orchestration), OpenRouter GPT-OSS-120B (deep reasoning) |
| ML | Scikit-Learn (RandomForest — approval & uplift prediction) |
| Database | MongoDB (citizen registry) |
| Search | FAISS (policy document vector search) |
| Frontend | *(add your frontend framework here, e.g. React + Vite)* |

## 🚀 Getting Started

### Prerequisites
- Python 3.12+
- MongoDB instance (local or Atlas)
- API keys: Google Gemini, OpenRouter

### Backend Setup
```bash
git clone https://github.com/vinayak-30-debug/JanSetu.git
cd JanSetu/backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file with:
```
GEMINI_API_KEY=your_key_here
OPENROUTER_API_KEY=your_key_here
MONGODB_URI=your_mongodb_uri
```

Run the API:
```bash
uvicorn main:app --reload
```

### Frontend Setup
```bash
cd JanSetu/frontend_repo
npm install
npm run dev
```

> ⚠️ Update the commands above to match your actual entry point and package manager if they differ.

## 👥 Team

Built by **Vinayak**, **Shiva**, and **Rohit**.

## 📌 Project Status

Hackathon-ready — core reasoning pipeline, registry, and predictive suite are functional (~90% complete, scale-ready). Contributions and issue reports are welcome.

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
