import { useState } from "react";
import type { FormEvent } from "react";

const API = "http://127.0.0.1:8000";

type Source = { filename: string; chunk_id: string; distance?: number | null };
type Message = { role: "user" | "assistant"; text: string; sources?: Source[] };

export default function App() {
  const [username, setUsername] = useState("employee");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [role, setRole] = useState("");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  async function login(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setNotice("");
    try {
      const form = new URLSearchParams();
      form.set("username", username);
      form.set("password", password);
      const res = await fetch(`${API}/auth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form.toString()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Login failed");
      setToken(data.access_token);
      setRole(data.role);
      setMessages([{ role: "assistant", text: `Signed in as ${username} (${data.role.replace("_", " ")}). Ask a question about approved HR documents.` }]);
      setPassword("");
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Login failed");
    } finally { setBusy(false); }
  }

  async function ask(e: FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q || !token) return;
    setMessages(prev => [...prev, { role: "user", text: q }]);
    setQuestion(""); setBusy(true); setNotice("");
    try {
      const res = await fetch(`${API}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ question: q })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Chat request failed");
      setMessages(prev => [...prev, { role: "assistant", text: data.answer, sources: data.sources }]);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Chat request failed");
    } finally { setBusy(false); }
  }

  async function ingest() {
    setBusy(true); setNotice("");
    try {
      const res = await fetch(`${API}/admin/ingest`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Ingestion failed");
      setNotice(`Indexed ${data.indexed_chunks} chunks from ${data.files_processed} files.`);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Ingestion failed");
    } finally { setBusy(false); }
  }

  function logout() {
    setToken(""); setRole(""); setMessages([]); setNotice("");
  }

  return <main className="shell">
    <header className="topbar">
      <div className="brand"><div className="brand-icon">HR</div><div><h1>PeopleDesk AI</h1><p>HR & Employee Knowledge Assistant</p></div></div>
      {token && <button className="secondary" onClick={logout}>Sign out</button>}
    </header>

    {!token ? <section className="login-card">
      <span className="eyebrow">LOCAL RAG ASSISTANT</span>
      <h2>Sign in to continue</h2>
      <p className="muted">Ask questions about approved company policies and guidance.</p>
      <form onSubmit={login} className="login-form">
        <label>Username<input value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" required /></label>
        <label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" required /></label>
        <button disabled={busy}>{busy ? "Signing in..." : "Sign in"}</button>
      </form>
      <p className="hint">Demo credentials are configured in the backend .env file. Change them before first use.</p>
    </section> : <section className="chat-layout">
      <aside className="side-card">
        <span className="eyebrow">SIGNED IN AS</span>
        <h3>{username}</h3>
        <span className="role-pill">{role.replace("_", " ")}</span>
        <div className="side-divider" />
        <h4>Try asking</h4>
        {["How do I apply for leave?", "What is the onboarding process?", "Who can access recruitment documents?"].map(q =>
          <button key={q} className="suggestion" onClick={() => setQuestion(q)}>{q}</button>)}
        {role === "hr_admin" && <button className="ingest" onClick={ingest} disabled={busy}>Index / refresh documents</button>}
      </aside>
      <section className="chat-card">
        <div className="chat-heading"><div><h2>HR Assistant</h2><p className="muted">Answers are grounded in documents your account can access.</p></div><span className="online-dot">Local models</span></div>
        <div className="messages">
          {messages.map((m, i) => <article className={`message ${m.role}`} key={i}>
            <div className="avatar">{m.role === "user" ? "You" : "AI"}</div>
            <div className="bubble"><p>{m.text}</p>
              {!!m.sources?.length && <div className="sources"><strong>Sources</strong>{m.sources.map(s => <div className="source" key={s.chunk_id}><span>▤ {s.filename}</span><small>Chunk {s.chunk_id.slice(0, 10)}</small></div>)}</div>}
            </div>
          </article>)}
          {busy && <div className="working">Working with local models…</div>}
        </div>
        <form className="composer" onSubmit={ask}>
          <input value={question} onChange={e => setQuestion(e.target.value)} placeholder="Ask an HR question..." disabled={busy} required />
          <button disabled={busy || !question.trim()} aria-label="Send question">Send ↑</button>
        </form>
      </section>
    </section>}
    {notice && <div className="notice" role="status">{notice}</div>}
    <footer>Prototype · Local Ollama models · Do not upload confidential employee data until security review is complete.</footer>
  </main>;
}
