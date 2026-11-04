🚀 How to Run CampusBridge AI from GitHub
Follow these instructions to clone your repository from GitHub and run both the FastAPI backend and Next.js frontend locally.

Prerequisites
Python 3.10+ installed on your system.

Node.js (v18+) & npm installed.

Git installed.

Step 1: Clone the Repository
Open your terminal and run the following commands to clone the repository and navigate into the project directory:

Bash
git clone https://github.com/Arijeet223/jklu_campusbridge.git
cd jklu_campusbridge
Step 2: Set Up and Run the Backend (FastAPI)
Create and activate a Python virtual environment:

Bash
python -m venv .venv

# On Windows (PowerShell/CMD):
.venv\Scripts\activate

# On macOS/Linux:
source .venv/bin/activate
Install backend dependencies:

Bash
pip install -r requirements.txt
(If there is no standalone requirements.txt, ensure your environment has FastAPI, uvicorn, openpyxl, pandas, and sentence-transformers installed).

Start the FastAPI backend server:
Point uvicorn directly to the backend directory using the app-dir flag:

Bash
python -m uvicorn backend.main:app --app-dir backend --reload
The backend API will run live at [http://127.0.0.1:8000](http://127.0.0.1:8000).

Step 3: Set Up and Run the Frontend (Next.js)
Open a new, separate terminal window/tab and navigate into the web application directory:

Bash
cd apps/web
Install frontend dependencies:

Bash
npm install
Start the Next.js development server:

Bash
npm run dev
Open your browser and navigate to http://localhost:3000 (or http://localhost:3001 if port 3000 is busy) to view the fully styled pastel tactile platform.

Step 4: Run Automated Tests (Optional)
To verify that all 51 backend tests, RAG pipelines, and MCP ecosystem checks pass successfully:

Bash
# Ensure your virtual environment is active (.venv)
python -m pytest -v