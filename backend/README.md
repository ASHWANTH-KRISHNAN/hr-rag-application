# HR & Employee RAG backend

## Prerequisites
- Python 3.11+ recommended
- MySQL Server
- Ollama running locally
- Models already installed: `ollama list` should show `llama3.2` and `nomic-embed-text`

## 1. Create MySQL database and user
Run these statements in MySQL as an administrator (change the password):
```sql
CREATE DATABASE hr_rag CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'hr_rag_user'@'localhost' IDENTIFIED BY 'UseA_Strong_Password_Here';
GRANT ALL PRIVILEGES ON hr_rag.* TO 'hr_rag_user'@'localhost';
FLUSH PRIVILEGES;
```
If using a different MySQL host, configure the matching host grants and `DATABASE_URL`.

## 2. Configure environment
From the `backend` directory:
```cmd
copy .env.example .env
```
Edit `.env` and set `DATABASE_URL`, `JWT_SECRET`, and strong initial seed passwords **before first startup**. Keep `.env` private; do not commit it.

The database URL format is:
`mysql+pymysql://hr_rag_user:YOUR_URL_ENCODED_PASSWORD@127.0.0.1:3306/hr_rag`
URL-encode special characters in the password.

## 3. Install and run
```cmd
py -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
The API creates the `users` and `employee_records` tables and two demo login users only when the users table is empty. Seed credentials come from `.env`. Change them before first launch. If the users table already has users, seed users are not created.

API docs: http://127.0.0.1:8000/docs

## 4. Ingest documents
Put approved files under:
- `data/employee/` for documents visible to authenticated employees
- `data/hr_admin/` for documents visible only to HR Admins

Supported formats: PDF, DOCX, TXT. Scanned PDFs need OCR, which is not included.

Log in as the HR admin using `POST /auth/token` (form fields `username` and `password`), then use the returned Bearer token for `POST /admin/ingest`. In Swagger UI, click **Authorize** and enter the token when prompted. Or use the React frontend's Admin ingest button after logging in as HR Admin.

## 5. Chat
`POST /chat` JSON:
```json
{"question":"How do I apply for leave?"}
```
Requires `Authorization: Bearer <token>`. The role is taken from the authenticated user record, not the request body.

## Important limitations
- This is a local prototype, not a production-ready HR system.
- Do not ingest real employee sensitive data until security, legal, retention, audit, backups, and access controls have been reviewed.
- Current role filtering distinguishes employee-visible documents from HR-only documents. It does not yet implement per-employee document ACLs, department restrictions, or individual leave-balance access.
- Never expose this API publicly without HTTPS, hardened authentication, rate limiting, secret management, monitoring, and a security review.
- RAG is for document Q&A. Use permission-checked SQL queries for live balances and employee records.
