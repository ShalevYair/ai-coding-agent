🤖 AI Coding Agent
A lightweight, mobile-first AI development partner that turns chat instructions into real-world code updates on GitHub.

🚀 Overview
This agent is designed to bridge the gap between AI reasoning and version control. It uses Gemini 2.5 Flash to plan and execute code changes directly to a GitHub repository, maintaining project context through a smart mapping system.

✨ Key Features
Conversational Interface: Chat-based interaction for planning and executing tasks.

GitHub Integration: Automatic file reading and committing via GitHub API.

Context Awareness: Uses a project_map.json to "remember" the project structure and save tokens.

Step-by-Step Execution: Proposes a plan and waits for user confirmation before pushing changes.

Mobile Optimized: Designed specifically for developer productivity on the go.

🛠 Tech Stack
AI: Google Gemini 2.5 Flash API.

Backend: Node.js / Express (Hosted on Vercel).

Frontend: React (Lucide Icons, Axios).

Source Control: GitHub API (Octokit).

📁 Project Structure
index.html: The main entry point for the agent's web interface.

project_map.json: The AI's "long-term memory" containing file descriptions and tech stack details.

README.md: Project documentation (this file).

🔐 Security
The agent requires user-provided API keys (Gemini & GitHub Token), which are stored locally in the browser's localStorage and never saved on the server.
