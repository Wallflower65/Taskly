# 🗺️ Taskly

Hey there! Welcome to **Taskly**, a clean, minimalist, full-stack task management platform built to handle busy schedules without the clutter. 

Most task apps are either too simple or overwhelmingly complicated. Taskly hits the sweet spot—giving you a beautiful, modern space to organize your life, create dedicated workspaces, and keep your tasks isolated exactly where they belong.

👉 **Live Frontend:** [taskly-platform.netlify.app](https://taskly-platform.netlify.app)  
👉 **Live Backend API:** [taskly-api-502k.onrender.com/api](https://taskly-api-502k.onrender.com/api)

---

## ✨ What it Does

*   **🔒 Secure Spaces:** Sign up, log in safely, and keep your data protected behind secure JWT authentication.
*   **📂 Multi-Tenant Workspaces:** Create separate workspaces for different areas of your life (like "Personal", "Work", or "Side Projects") so your tasks never bleed into each other.
*   **⚡ Smooth Task Management:** Easily create, categorise, prioritise, and track your tasks with real-time status updates.
*   **🛠️ Relational Database Integrity:** Everything is backed by a relational cloud database designed with smart cascade rules—meaning if you delete a workspace, it cleans up all matching tasks automatically.

---

## 🏗️ The Tech Stack

I built Taskly using a modern, decoupled architecture to ensure the user interface stays lightning-fast while the server handles heavy data securely:

*   **Frontend:** React.js (Vite) styled with clean, responsive **Tailwind CSS**. It handles network traffic smoothly using Axios request interceptors.
*   **Backend:** Node.js & Express.js API acting as the central engine.
*   **Database:** A robust **PostgreSQL** cluster hosted in the cloud, running over strictly encrypted SSL connections (`PGSSLMODE`).

---

## 📁 How the Project is Organised

The project is split into two clean directories:

```text
taskly-workspace/
├── task-manager-frontend/   # The beautiful React UI you see in the browser
└── task-manager-backend/    # The Express server & PostgreSQL database logic
