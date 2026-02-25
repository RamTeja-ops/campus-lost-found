import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const BASE_URL = "http://localhost:5000";

export default function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const displayName = localStorage.getItem("displayName");
  const role = localStorage.getItem("role"); // store role on login

  const [item, setItem] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState("");

  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);

  // ─── Fetch item details ───────────────────────────────────────────────────
  const fetchItem = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/lostitems`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const found = res.data.find((i) => i._id === id);
      if (found) setItem(found);
    } catch {
      setError("Failed to load item details.");
    }
  };

  // ─── Fetch chat messages ──────────────────────────────────────────────────
  const fetchMessages = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/lostitems/${id}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(res.data);
    } catch {
      // silently fail on poll
    }
  };

  // ─── Send a message ───────────────────────────────────────────────────────
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      await axios.post(
        `${BASE_URL}/api/lostitems/${id}/messages`,
        { text: newMessage.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewMessage("");
      await fetchMessages();
    } catch {
      setError("Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  // ─── Resolve item (faculty only) ──────────────────────────────────────────
  const resolveItem = async () => {
    if (!window.confirm("Mark this item as resolved? This will delete all chat messages.")) return;
    setResolving(true);
    try {
      await axios.put(
        `${BASE_URL}/api/lostitems/${id}/resolve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigate("/dashboard");
    } catch {
      setError("Failed to resolve item. Make sure you have faculty privileges.");
      setResolving(false);
    }
  };

  // ─── Scroll to bottom when messages change ────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ─── Initial load ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) { navigate("/login"); return; }

    const init = async () => {
      await fetchItem();
      await fetchMessages();
      setLoading(false);
    };
    init();

    // Poll for new messages every 5 seconds
    pollRef.current = setInterval(fetchMessages, 5000);
    return () => clearInterval(pollRef.current);
  }, [id]);

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const formatTime = (ts) =>
    new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const formatDate = (ts) =>
    new Date(ts).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });

  // ─── Render ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="container mt-5 text-center">
        <h4 className="text-muted">Item not found or already resolved.</h4>
        <button className="btn btn-primary mt-3" onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="container py-4" style={{ maxWidth: 900 }}>
      {/* ── Top bar ── */}
      <div className="d-flex align-items-center mb-4 gap-3">
        <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate("/dashboard")}>
          ← Back
        </button>
        <h4 className="mb-0 fw-bold text-primary">Item Detail & Chat</h4>
        <span
          className={`badge ms-auto ${item.status === "resolved" ? "bg-success" : "bg-warning text-dark"}`}
        >
          {item.status === "resolved" ? "Resolved" : "Active"}
        </span>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible">
          {error}
          <button className="btn-close" onClick={() => setError("")} />
        </div>
      )}

      <div className="row g-4">
        {/* ── Left: Item details ── */}
        <div className="col-md-5">
          <div className="card shadow-sm h-100">
            {item.image && (
              <img
                src={`${BASE_URL}/uploads/${item.image}`}
                alt={item.itemName}
                className="card-img-top"
                style={{ objectFit: "cover", maxHeight: 260 }}
              />
            )}
            <div className="card-body">
              <h5 className="card-title fw-bold">{item.itemName}</h5>
              <p className="card-text text-muted mb-2">{item.description}</p>

              <ul className="list-unstyled small">
                <li>
                  <span className="fw-semibold">📍 Location:</span> {item.location}
                </li>
                <li>
                  <span className="fw-semibold">📅 Found on:</span>{" "}
                  {item.dateFound ? formatDate(item.dateFound) : "N/A"}
                </li>
                <li>
                  <span className="fw-semibold">👤 Submitted by:</span>{" "}
                  {item.submittedBy?.name || "Unknown"}
                </li>
                {item.facultyMediator && (
                  <li>
                    <span className="fw-semibold">🎓 Mediator:</span> {item.facultyMediator}
                  </li>
                )}
              </ul>

              {/* Faculty resolve button */}
              {role === "faculty" && item.status !== "resolved" && (
                <button
                  className="btn btn-success w-100 mt-3"
                  onClick={resolveItem}
                  disabled={resolving}
                >
                  {resolving ? "Resolving…" : "✔ Mark as Resolved"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Right: Chat ── */}
        <div className="col-md-7">
          <div className="card shadow-sm d-flex flex-column" style={{ height: 520 }}>
            <div className="card-header bg-primary text-white fw-semibold">
              💬 Chat — {messages.length} message{messages.length !== 1 ? "s" : ""}
            </div>

            {/* Messages area */}
            <div
              className="flex-grow-1 overflow-auto p-3"
              style={{ background: "#f8f9fa" }}
            >
              {messages.length === 0 ? (
                <div className="text-center text-muted mt-5">
                  <p>No messages yet.</p>
                  <small>Be the first to start the conversation!</small>
                </div>
              ) : (
                messages.map((msg) => {
                  const isOwn = msg.sender?.name === displayName;
                  return (
                    <div
                      key={msg._id}
                      className={`d-flex mb-3 ${isOwn ? "justify-content-end" : "justify-content-start"}`}
                    >
                      <div style={{ maxWidth: "75%" }}>
                        {/* Sender name (others only) */}
                        {!isOwn && (
                          <small className="text-muted d-block mb-1 ms-1">
                            {msg.sender?.name || "Unknown"}
                          </small>
                        )}
                        <div
                          className={`px-3 py-2 rounded-3 ${
                            isOwn
                              ? "bg-primary text-white"
                              : "bg-white border text-dark"
                          }`}
                          style={{ wordBreak: "break-word" }}
                        >
                          {msg.text}
                        </div>
                        <small
                          className={`text-muted d-block mt-1 ${isOwn ? "text-end" : ""}`}
                        >
                          {formatTime(msg.createdAt)}
                        </small>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message input */}
            {item.status === "resolved" ? (
              <div className="card-footer text-center text-muted small">
                This item has been resolved. Chat is closed.
              </div>
            ) : (
              <form className="card-footer d-flex gap-2 p-2" onSubmit={sendMessage}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Type a message…"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={sending}
                  autoComplete="off"
                />
                <button
                  type="submit"
                  className="btn btn-primary px-3"
                  disabled={sending || !newMessage.trim()}
                >
                  {sending ? "…" : "Send"}
                </button>
              </form>
            )}
          </div>

          <p className="text-muted small mt-2 text-center">
            🔄 Chat refreshes automatically every 5 seconds
          </p>
        </div>
      </div>
    </div>
  );
}