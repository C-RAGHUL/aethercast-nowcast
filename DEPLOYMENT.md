# 🚀 AetherCast Thunderstorm & Lightning Nowcasting - Deployment Guide

This repository contains everything needed to deploy the **AetherCast AI/ML Thunderstorm Nowcasting System** to any cloud host or container platform.

---

## 🌟 Option 1: Deploy with Docker (Recommended - 100% Automated)
Works on **Render, Railway, Fly.io, Hugging Face Spaces, Google Cloud Run, AWS App Runner, DigitalOcean**.

### Step-by-Step for Render (Free Tier):
1. Create a free account at [https://render.com](https://render.com).
2. Click **New +** ➔ **Web Service**.
3. Choose **Build and deploy from a Git repository** (or connect your GitHub repo).
4. Select **Docker** as the runtime (Render will automatically detect the `Dockerfile`).
5. Click **Create Web Service**.
6. Render will build both the frontend and backend and give you a permanent `https://your-app.onrender.com` URL!

---

## 🐳 Option 2: Run with Docker Compose (Local / VPS)
If you have Docker installed on your computer or VPS:
```bash
docker compose up --build -d
```
Open `http://localhost:8000` in your browser.

---

## ⚡ Option 3: Deploy on Hugging Face Spaces (100% Free Forever)
1. Go to [https://huggingface.co/spaces](https://huggingface.co/spaces) and click **Create new Space**.
2. Space SDK: Select **Docker** (Blank).
3. Push/Upload this repository (including `Dockerfile`).
4. Hugging Face will build the container and provide a 24/7 free HTTPS link.

---

## 💻 Option 4: Deploy on Railway
1. Go to [https://railway.app](https://railway.app).
2. Click **New Project** ➔ **Deploy from GitHub repo**.
3. Railway automatically detects `Dockerfile` and deploys it with a public domain.
