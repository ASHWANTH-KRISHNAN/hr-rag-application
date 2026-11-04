# HR & Employee RAG System

A local prototype using Ollama (`llama3.2`, `nomic-embed-text`), FastAPI, ChromaDB, MySQL, and React/Vite.

Start with `backend/README.md` for MySQL setup, environment configuration, backend launch, and document ingestion. Then see `frontend/` instructions below.

## Run frontend
1. Install Node.js LTS if needed.
2. Open a terminal in `frontend`.
3. Run:
   ```cmd
   npm install
   npm run dev
   ```
4. Open the Vite URL shown (normally http://localhost:5173).

## Workflow
1. Start Ollama.
2. Configure MySQL and backend `.env`.
3. Run FastAPI from `backend`.
4. Sign in as HR Admin and click **Index / refresh documents** to index files in `backend/data/`.
5. Sign in as employee and ask questions. Employees retrieve only `data/employee/`; HR Admin retrieves both document tiers.

The sample documents and credentials are fictional. This is a prototype, not production-ready HR software.
