# Job Importer System (Node.js + Redis + MongoDB + Next.js)

A full-stack job importing and monitoring system that:

- Fetches job feeds from external sources (XML/Feed),
- Queues and processes them via Redis + BullMQ,
- Stores jobs and import logs in MongoDB,
- Displays logs and job listings via a Next.js frontend.

- **Backend**: Express.js, BullMQ, Redis, MongoDB
- **Frontend**: Next.js (App Router), Axios, TailwindCSS
- **Queue**: BullMQ (with Redis)
- **Database**: MongoDB

## 🛠️ Backend Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Sahilbhanushali/job-importer-system.git
cd job-importer-system
```

### 2. Install Backend Dependencies

cd server
npm install

### 3. Create a .env file inside /server:

PORT=5003
MONGO_URI=""

### 4. Start Backend

# Start Express API

npm run dev

# Start job worker (in another terminal)

node src/jobs/jobWorker.js

### 5 Run Job Importer

node src/jobs/fetchJobs.js

### Frontend Setup (Next.js)

cd client
npm install
npm run dev

### Features

# Import jobs from multiple job boards

# Deduplicates and updates existing job records

# Import history dashboard

# Job queue with Redis + BullMQ
