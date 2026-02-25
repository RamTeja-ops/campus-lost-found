import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showAbout, setShowAbout] = useState(false);
  const [showContact, setShowContact] = useState(false);

  // ── Chat state ────────────────────────────────────────────────
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [resolving, setResolving] = useState(false);

  // ── Rankings state ────────────────────────────────────────────
  const [rankings, setRankings] = useState([]);
  const [rankingsLoading, setRankingsLoading] = useState(false);

  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const displayName = localStorage.getItem("displayName");
  const role = localStorage.getItem("role");

  useEffect(() => {
    fetchItems();
  }, []);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Fetch all active items ────────────────────────────────────
  const fetchItems = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/lostitems", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems(res.data);
    } catch (error) {
      console.log("Error fetching items");
    }
  };

  // ── Fetch messages for selected item ─────────────────────────
  const fetchMessages = async (itemId) => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/messages/${itemId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(res.data);
    } catch (error) {
      console.log("Error fetching messages");
    }
  };

  // ── Fetch rankings ────────────────────────────────────────────
  const fetchRankings = async () => {
    setRankingsLoading(true);
    try {
      const res = await axios.get("http://localhost:5000/api/auth/rankings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRankings(res.data);
    } catch (error) {
      console.log("Error fetching rankings");
    } finally {
      setRankingsLoading(false);
    }
  };

  // ── When a card is clicked → load item + messages + start poll
  const handleOpenItem = (item) => {
    setSelectedItem(item);
    setMessages([]);
    setNewMessage("");
    fetchMessages(item._id);

    clearInterval(pollRef.current);
    pollRef.current = setInterval(() => fetchMessages(item._id), 5000);
  };

  // ── When chat modal is closed → stop polling ──────────────────
  const handleCloseModal = () => {
    clearInterval(pollRef.current);
    setSelectedItem(null);
    setMessages([]);
    setNewMessage("");
  };

  // ── Send a message ────────────────────────────────────────────
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedItem) return;

    setSending(true);
    try {
      await axios.post(
        `http://localhost:5000/api/messages/${selectedItem._id}`,
        { text: newMessage.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewMessage("");
      await fetchMessages(selectedItem._id);
    } catch (error) {
      alert("Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  // ── Resolve item (faculty only) ───────────────────────────────
  const handleResolve = async () => {
    if (!window.confirm("Mark this item as resolved? All chat messages will be deleted.")) return;

    setResolving(true);
    try {
      await axios.put(
        `http://localhost:5000/api/lostitems/${selectedItem._id}/resolve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      clearInterval(pollRef.current);

      // Close chat modal cleanly
      const modalEl = document.getElementById("itemModal");
      modalEl.classList.remove("show");
      modalEl.style.display = "none";
      document.body.classList.remove("modal-open");
      document.querySelector(".modal-backdrop")?.remove();

      setSelectedItem(null);
      setMessages([]);
      fetchItems();
    } catch (error) {
      alert("Failed to resolve item.");
    } finally {
      setResolving(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const formatTime = (ts) =>
    new Date(ts).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  // ── Medal for top 3 ───────────────────────────────────────────
  const getMedal = (index) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `#${index + 1}`;
  };

  return (
    <div>

      {/* NAVBAR */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark px-4">
        <span className="navbar-brand fw-bold">
          Campus Lost & Found
        </span>

        {/* CENTER MENU */}
        <div className="mx-auto d-flex gap-4 text-white">
          <span style={{ cursor: "pointer" }}>Home</span>

          <span
            style={{ cursor: "pointer" }}
            onClick={() => {
              setShowAbout(!showAbout);
              setShowContact(false);
            }}
          >
            About Us
          </span>

          {/* ── RANKINGS BUTTON ── */}
          <span
            style={{ cursor: "pointer" }}
            data-bs-toggle="modal"
            data-bs-target="#rankingsModal"
            onClick={fetchRankings}
          >
            🏆 Rankings
          </span>

          <span
            style={{ cursor: "pointer" }}
            onClick={() => {
              setShowContact(!showContact);
              setShowAbout(false);
            }}
          >
            Contact Us
          </span>
        </div>

        {/* PROFILE DROPDOWN */}
        <div className="dropdown">
          <button
            className="btn btn-dark dropdown-toggle text-warning fw-bold"
            type="button"
            data-bs-toggle="dropdown"
          >
            {displayName}
          </button>

          <ul className="dropdown-menu dropdown-menu-end">
            <li>
              <button
                className="dropdown-item text-danger"
                onClick={handleLogout}
              >
                Logout
              </button>
            </li>
          </ul>
        </div>
      </nav>

      {/* ABOUT SECTION */}
      {showAbout && (
        <div className="bg-light p-4 shadow-sm">
          <div className="container">
            <h5>About Campus Lost & Found</h5>
            <p>
              This platform helps students and faculty report and recover
              lost items across campus efficiently and securely.
            </p>
          </div>
        </div>
      )}

      {/* CONTACT SECTION */}
      {showContact && (
        <div className="bg-light p-4 shadow-sm">
          <div className="container">
            <h5>Contact Us</h5>
            <p>Email: support@college.edu</p>
            <p>Office: Admin Block</p>
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <div className="container mt-5">

        <h2 className="text-center mb-5 text-success fw-bold">
          Recently Lost Items
        </h2>

        <div className="text-center mb-4">
          <button
            className="btn btn-success"
            onClick={() => navigate("/add-item")}
          >
            + Add Lost Item
          </button>
        </div>

        <div className="row justify-content-center">
          <div className="col-lg-8">

            {items.map((item) => (
              <div
                key={item._id}
                className="card shadow-sm mb-4"
                style={{ cursor: "pointer" }}
                onClick={() => handleOpenItem(item)}
                data-bs-toggle="modal"
                data-bs-target="#itemModal"
              >
                <div className="row g-0">

                  {/* IMAGE SECTION */}
                  <div className="col-md-4">
                    <img
                      src={`http://localhost:5000/uploads/${item.image}`}
                      alt={item.itemName}
                      className="img-fluid rounded-start"
                      style={{ height: "100%", objectFit: "cover" }}
                    />
                  </div>

                  {/* DETAILS SECTION */}
                  <div className="col-md-8">
                    <div className="card-body">

                      <div className="d-flex justify-content-between">
                        <h5 className="fw-bold">{item.itemName}</h5>
                        <span
                          className={`badge ${
                            item.status === "active"
                              ? "bg-warning text-dark"
                              : "bg-success"
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>

                      <p className="text-muted mb-2">{item.description}</p>

                      <p className="mb-1">
                        <strong>Location:</strong> {item.location}
                      </p>

                      <p className="mb-1">
                        <strong>Date Found:</strong>{" "}
                        {new Date(item.dateFound).toLocaleDateString()}
                      </p>

                      {item.facultyMediator && (
                        <p className="mb-1">
                          <strong>Faculty Mediator:</strong>{" "}
                          {item.facultyMediator}
                        </p>
                      )}

                      <small className="text-secondary">
                        Submitted by:{" "}
                        {item.submittedBy?.rollNumber || item.submittedBy?.name}
                      </small>

                    </div>
                  </div>

                </div>
              </div>
            ))}

          </div>
        </div>
      </div>

      {/* ── CHAT MODAL ───────────────────────────────────────────── */}
      <div
        className="modal fade"
        id="itemModal"
        tabIndex="-1"
        data-bs-backdrop="static"
      >
        <div className="modal-dialog modal-lg">
          <div className="modal-content">

            {selectedItem && (
              <>
                {/* HEADER */}
                <div className="modal-header bg-dark text-white">
                  <div>
                    <h5 className="modal-title mb-0">
                      {selectedItem.itemName}
                    </h5>
                    <small className="text-warning">
                      📍 {selectedItem.location} &nbsp;|&nbsp; Submitted by:{" "}
                      {selectedItem.submittedBy?.rollNumber ||
                        selectedItem.submittedBy?.name}
                    </small>
                  </div>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    data-bs-dismiss="modal"
                    onClick={handleCloseModal}
                  />
                </div>

                {/* BODY — two columns */}
                <div className="modal-body p-0">
                  <div className="row g-0" style={{ minHeight: "420px" }}>

                    {/* LEFT — Item details */}
                    <div className="col-md-4 border-end p-3 bg-light d-flex flex-column">
                      <img
                        src={`http://localhost:5000/uploads/${selectedItem.image}`}
                        alt={selectedItem.itemName}
                        className="img-fluid rounded mb-3"
                        style={{ objectFit: "cover", maxHeight: "160px" }}
                      />

                      <p className="small text-muted mb-2">
                        {selectedItem.description}
                      </p>

                      <p className="small mb-1">
                        <strong>Location:</strong> {selectedItem.location}
                      </p>

                      <p className="small mb-1">
                        <strong>Date Found:</strong>{" "}
                        {new Date(selectedItem.dateFound).toLocaleDateString()}
                      </p>

                      {selectedItem.facultyMediator && (
                        <p className="small mb-1">
                          <strong>Mediator:</strong>{" "}
                          {selectedItem.facultyMediator}
                        </p>
                      )}

                      <span
                        className={`badge mt-2 align-self-start ${
                          selectedItem.status === "active"
                            ? "bg-warning text-dark"
                            : "bg-success"
                        }`}
                      >
                        {selectedItem.status}
                      </span>

                      {/* Faculty resolve button — only assigned mediator or submitter */}
                      {role === "faculty" &&
                        selectedItem.status === "active" &&
                        (selectedItem.facultyMediator === displayName ||
                          selectedItem.submittedBy?.name === displayName) && (
                          <button
                            className="btn btn-success btn-sm mt-auto"
                            onClick={handleResolve}
                            disabled={resolving}
                          >
                            {resolving ? "Resolving…" : "✔ Mark as Resolved"}
                          </button>
                        )}
                    </div>

                    {/* RIGHT — Chat */}
                    <div className="col-md-8 d-flex flex-column">

                      {/* Messages */}
                      <div
                        className="flex-grow-1 overflow-auto p-3"
                        style={{ height: "360px", background: "#f8f9fa" }}
                      >
                        {messages.length === 0 ? (
                          <div className="text-center text-muted mt-5">
                            <p>No messages yet.</p>
                            <small>Start the conversation below!</small>
                          </div>
                        ) : (
                          messages.map((msg) => {
                            const isOwn =
                              msg.sender?.rollNumber === displayName ||
                              msg.sender?.name === displayName;

                            return (
                              <div
                                key={msg._id}
                                className={`d-flex mb-3 ${
                                  isOwn
                                    ? "justify-content-end"
                                    : "justify-content-start"
                                }`}
                              >
                                <div style={{ maxWidth: "75%" }}>

                                  {!isOwn && (
                                    <small className="text-muted d-block mb-1 ms-1">
                                      {msg.sender?.rollNumber ||
                                        msg.sender?.name}
                                    </small>
                                  )}

                                  <div
                                    className={`px-3 py-2 rounded-3 ${
                                      isOwn
                                        ? "bg-success text-white"
                                        : "bg-white border text-dark"
                                    }`}
                                    style={{ wordBreak: "break-word" }}
                                  >
                                    {msg.text}
                                  </div>

                                  <small
                                    className={`text-muted d-block mt-1 ${
                                      isOwn ? "text-end" : ""
                                    }`}
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

                      {/* Input — locked if resolved */}
                      {selectedItem.status === "resolved" ? (
                        <div className="p-3 text-center text-muted border-top small bg-white">
                          This item has been resolved. Chat is closed.
                        </div>
                      ) : (
                        <form
                          className="d-flex gap-2 p-2 border-top bg-white"
                          onSubmit={sendMessage}
                        >
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
                            className="btn btn-success px-3"
                            disabled={sending || !newMessage.trim()}
                          >
                            {sending ? "…" : "Send"}
                          </button>
                        </form>
                      )}

                    </div>
                  </div>
                </div>

                {/* FOOTER */}
                <div className="modal-footer py-2">
                  <small className="text-muted me-auto">
                    🔄 Chat refreshes every 5 seconds
                  </small>
                  <button
                    className="btn btn-secondary btn-sm"
                    data-bs-dismiss="modal"
                    onClick={handleCloseModal}
                  >
                    Close
                  </button>
                </div>

              </>
            )}

          </div>
        </div>
      </div>
      {/* ── END CHAT MODAL ───────────────────────────────────────── */}


      {/* ── RANKINGS MODAL ──────────────────────────────────────── */}
      <div
        className="modal fade"
        id="rankingsModal"
        tabIndex="-1"
      >
        <div className="modal-dialog modal-lg">
          <div className="modal-content">

            {/* HEADER */}
            <div className="modal-header bg-dark text-white">
              <h5 className="modal-title">🏆 Campus Rankings</h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                data-bs-dismiss="modal"
              />
            </div>

            {/* BODY */}
            <div className="modal-body p-0">

              {rankingsLoading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-success" />
                  <p className="mt-2 text-muted">Loading rankings…</p>
                </div>
              ) : rankings.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <p>No rankings yet.</p>
                  <small>Submit and resolve items to earn points!</small>
                </div>
              ) : (
                <table className="table table-hover mb-0">
                  <thead className="table-dark">
                    <tr>
                      <th>Rank</th>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Resolved Items</th>
                      <th>Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankings.map((user, index) => (
                      <tr
                        key={user._id}
                        className={
                          index === 0
                            ? "table-warning fw-bold"
                            : index === 1
                            ? "table-secondary fw-bold"
                            : index === 2
                            ? "table-danger fw-bold"
                            : ""
                        }
                      >
                        {/* Rank */}
                        <td className="fs-5">{getMedal(index)}</td>

                        {/* Name */}
                        <td>
                          {user.rollNumber || user.name}
                          {(user.rollNumber === displayName ||
                            user.name === displayName) && (
                            <span className="badge bg-success ms-2">You</span>
                          )}
                        </td>

                        {/* Category */}
                        <td>
                          <span
                            className={`badge ${
                              user.role === "faculty"
                                ? "bg-primary"
                                : "bg-warning text-dark"
                            }`}
                          >
                            {user.role === "faculty" ? "Faculty" : "Student"}
                          </span>
                        </td>

                        {/* Resolved Items count */}
                        <td className="text-center fw-bold">
                          {user.resolvedCount}
                        </td>

                        {/* Points */}
                        <td>
                          <span className="fw-bold text-success">
                            {user.points} pts
                          </span>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

            </div>

            {/* FOOTER */}
            <div className="modal-footer py-2">
              <small className="text-muted me-auto">
                🌟 5 pts per item (10 pts after 5 resolved items)
              </small>
              <button
                className="btn btn-secondary btn-sm"
                data-bs-dismiss="modal"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      </div>
      {/* ── END RANKINGS MODAL ──────────────────────────────────── */}

    </div>
  );
}

export default Dashboard;