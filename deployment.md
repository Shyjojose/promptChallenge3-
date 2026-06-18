# Cloud Run Deployment Guide

This guide explains how to package the Terra Carbon Tracker into a single, production-ready Docker container and deploy it to Google Cloud Run under your project `promptchallenge-499808`.

## 1. Why Cloud Run?
Because our application acts as a secure reverse-proxy (to hide the API keys) and serves a static React frontend, deploying it as a unified Docker container to Cloud Run is the perfect solution. It is fully serverless, scales to zero when not in use, and natively authenticates to Vertex AI without needing hardcoded keys!

## 2. Prerequisites
Ensure you have the `gcloud` CLI installed and authenticated:
```bash
gcloud auth login
gcloud config set project promptchallenge-499808
```

Ensure the necessary APIs are enabled in your project:
```bash
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable aiplatform.googleapis.com
```

## 3. Deployment Steps

Since we've already written the `Dockerfile` and configured `server/index.js` to serve the static frontend, you can deploy the app directly from your source code using Cloud Build.

Run the following command from the root of the repository:
```bash
gcloud run deploy terra-tracker \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars=NODE_ENV=production
```

## 4. What happens during deployment?
1. **Cloud Build** uploads your source code and uses the `Dockerfile` to compile the Vite React App into the `dist/` directory.
2. It strips out devDependencies and creates a secure `node:20-alpine` image.
3. **Cloud Run** provisions a serverless container instance and routes traffic to the Express backend (running on port `8080`).
4. When a user hits the base URL, Express serves the compiled React app! When the React app makes an API request to `/api/terra`, Express processes it and proxies it securely to Gemini.
