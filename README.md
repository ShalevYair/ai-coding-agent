🤖 AI Coding Agent
A lightweight, mobile-first AI development partner that turns chat instructions into real-world code updates on GitHub.

🚀 Overview
This agent bridges the gap between AI reasoning and version control. It uses Gemini 3 Flash Preview to plan and execute code changes directly to a GitHub repository, maintaining project context through a smart mapping system. The agent operates in a full development cycle: plan → execute → push → verify → fix.

✨ Key Features
Conversational Interface: Chat-based interaction for planning and executing tasks.

GitHub Integration: Automatic file reading and committing via GitHub API.

Context Awareness: Uses a project_map.json to "remember" the project structure and save tokens.

Step-by-Step Execution: Proposes a plan and waits for user confirmation before pushing changes.

Undo Support: Restores any file to its pre-execution state with one click.

Auto-Retry: Automatically retries failed pushes up to 1/3/5 times (user-configurable).

Deep Scan Mode (S): Reads all project files for a comprehensive, definitive answer using Gemini 2.5 Flash-Lite.

Mobile Optimized: Designed specifically for developer productivity on the go.

🛠 Tech Stack
AI (main): Google Gemini 3 Flash Preview API.

AI (scan/refresh): Google Gemini 2.5 Flash-Lite API.

Backend: Node.js / Express (Hosted on Vercel).

Frontend: React (Lucide Icons, Axios).

Source Control: GitHub API (Octokit).

📁 Project Structure
api/index.js: Express serverless app — all API routes.

server/services/aiService.js: Gemini AI wrapper (model-agnostic constructor).

server/services/githubService.js: GitHub API wrapper (read, write, scan).

client/src/: React frontend — hooks, components, modals.

project_map.json: The AI's "long-term memory" containing file descriptions and tech stack details.

Gemini.md: Full project context loaded into the AI on every request.

🔐 Security
The agent requires user-provided API keys (Gemini & GitHub Token), which are stored locally in the browser's localStorage and never saved on the server.
