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

  // ── Date filter state ─────────────────────────────────────────
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filteredItems, setFilteredItems] = useState([]);

  // ── Resolve modal state ───────────────────────────────────────
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [chatParticipants, setChatParticipants] = useState([]);
  const [selectedFinder, setSelectedFinder] = useState("");

  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const displayName = localStorage.getItem("displayName");
  const role = localStorage.getItem("role");

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    if (fromDate || toDate) {
      setFilteredItems(
        items.filter((item) => {
          const itemDate = new Date(item.dateFound).toISOString().split("T")[0];
          if (fromDate && toDate)
            return itemDate >= fromDate && itemDate <= toDate;
          if (fromDate) return itemDate >= fromDate;
          if (toDate) return itemDate <= toDate;
        }),
      );
    } else {
      setFilteredItems(items);
    }
  }, [fromDate, toDate, items]);

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
        { headers: { Authorization: `Bearer ${token}` } },
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
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setNewMessage("");
      await fetchMessages(selectedItem._id);
    } catch (error) {
      alert("Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  // ── Step 1: Build participants list → show resolve modal ──────
  const handleResolveClick = () => {
    // Get unique senders from chat messages
    const senders = [];
    const seenIds = new Set();

    messages.forEach((msg) => {
      const id = msg.sender?._id;
      const label = msg.sender?.rollNumber || msg.sender?.name;
      if (id && !seenIds.has(id)) {
        seenIds.add(id);
        senders.push({
          _id: id,
          label: label,
          role: msg.sender?.role,
        });
      }
    });

    // Add faculty mediator if they haven't chatted yet
    const mediatorAlreadyIn = senders.some(
      (s) => s.label === selectedItem.facultyMediator
    );
    if (!mediatorAlreadyIn && selectedItem.facultyMediator) {
      senders.push({
        _id: "mediator_fallback_" + selectedItem.facultyMediator,
        label: selectedItem.facultyMediator,
        role: "faculty",
        isFallback: true,
      });
    }

    setChatParticipants(senders);
    setSelectedFinder("");
    setShowResolveModal(true);
  };

  // ── Step 2: Confirm resolve after faculty picks finder ────────
  const handleResolveConfirm = async () => {
    if (!selectedFinder) {
      alert("Please select who found the item.");
      return;
    }

    setResolving(true);
    try {
      // If mediator fallback selected, send name instead of id
      const isFallback = selectedFinder.startsWith("mediator_fallback_");
      await axios.put(
        `http://localhost:5000/api/lostitems/${selectedItem._id}/resolve`,
        isFallback
          ? { foundByName: selectedItem.facultyMediator }
          : { foundById: selectedFinder },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setShowResolveModal(false);
      clearInterval(pollRef.current);

      // Close chat modal cleanly
      const modalEl = document.getElementById("itemModal");
      modalEl.classList.remove("show");
      modalEl.style.display = "none";
      document.body.classList.remove("modal-open");
      document.querySelectorAll(".modal-backdrop").forEach((el) => el.remove());

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
        <span className="navbar-brand fw-bold">Campus Lost & Found</span>

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
                className="dropdown-item"
                onClick={() => navigate("/profile")}
              >
                👤 My Profile
              </button>
            </li>
            <li>
              <hr className="dropdown-divider" />
            </li>
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
              This platform helps students and faculty report and recover lost
              items across campus efficiently and securely.
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

        {/* DATE RANGE FILTER */}
        <div
          className="d-flex align-items-center gap-3 mb-4 p-3 rounded"
          style={{ background: "#f8f9fa", border: "1px solid #dee2e6" }}
        >
          <span className="fw-bold text-muted">🗓️ Filter by Date:</span>

          <div className="d-flex align-items-center gap-2">
            <label className="mb-0 text-muted small">From</label>
            <input
              type="date"
              className="form-control form-control-sm"
              style={{ width: "160px" }}
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>

          <span className="text-muted">→</span>

          <div className="d-flex align-items-center gap-2">
            <label className="mb-0 text-muted small">To</label>
            <input
              type="date"
              className="form-control form-control-sm"
              style={{ width: "160px" }}
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>

          {(fromDate || toDate) && (
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={() => {
                setFromDate("");
                setToDate("");
              }}
            >
              ✕ Clear
            </button>
          )}

          {(fromDate || toDate) && (
            <small className="text-muted ms-auto">
              Showing {filteredItems.length} item
              {filteredItems.length !== 1 ? "s" : ""}
            </small>
          )}
        </div>

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
            {filteredItems.map((item) => (
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

                      {/* ── Faculty resolve button ── */}
                      {role === "faculty" &&
                        selectedItem.status === "active" &&
                        (selectedItem.facultyMediator === displayName ||
                          selectedItem.submittedBy?.name === displayName) && (
                          <button
                            className="btn btn-success btn-sm mt-auto"
                            onClick={handleResolveClick}
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
      <div className="modal fade" id="rankingsModal" tabIndex="-1">
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
                        <td className="fs-5">{getMedal(index)}</td>
                        <td>
                          {user.rollNumber || user.name}
                          {(user.rollNumber === displayName ||
                            user.name === displayName) && (
                            <span className="badge bg-success ms-2">You</span>
                          )}
                        </td>
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
                        <td className="text-center fw-bold">
                          {user.resolvedCount}
                        </td>
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

      {/* ── RESOLVE CONFIRMATION MODAL ──────────────────────────── */}
      {showResolveModal && (
        <div
          className="modal fade show d-block"
          style={{ background: "rgba(0,0,0,0.6)", zIndex: 9999 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">

              {/* HEADER */}
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title">✔ Who Found This Item?</h5>
                <button
                  className="btn-close btn-close-white"
                  onClick={() => setShowResolveModal(false)}
                />
              </div>

              {/* BODY */}
              <div className="modal-body">
                <p className="mb-1">
                  <strong>Select the person who found this item.</strong>
                </p>
                <p className="text-muted small mb-3">
                  Contribution points will be awarded to the person you select.
                </p>

                {chatParticipants.length === 0 ? (
                  <div className="alert alert-warning mb-0">
                    ⚠️ No chat participants found. Ask participants to send at
                    least one message before resolving.
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-2">
                    {chatParticipants.map((person) => (
                      <label
                        key={person._id}
                        className="d-flex align-items-center gap-3 p-3 rounded"
                        style={{
                          border:
                            selectedFinder === person._id
                              ? "2px solid #198754"
                              : "1px solid #dee2e6",
                          background:
                            selectedFinder === person._id
                              ? "#f0fdf4"
                              : "white",
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                      >
                        <input
                          type="radio"
                          name="finder"
                          value={person._id}
                          checked={selectedFinder === person._id}
                          onChange={() => setSelectedFinder(person._id)}
                        />
                        <div className="d-flex align-items-center gap-2">
                          {/* Avatar */}
                          <div
                            className="d-flex align-items-center justify-content-center rounded-circle text-white fw-bold"
                            style={{
                              width: "36px",
                              height: "36px",
                              fontSize: "0.9rem",
                              background:
                                person.role === "faculty" ? "#0d6efd" : "#198754",
                              flexShrink: 0,
                            }}
                          >
                            {person.label?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="fw-bold">{person.label}</span>
                            <span
                              className={`badge ms-2 ${
                                person.role === "faculty"
                                  ? "bg-primary"
                                  : "bg-warning text-dark"
                              }`}
                            >
                              {person.role === "faculty" ? "Faculty" : "Student"}
                            </span>
                            {person.isFallback && (
                              <span className="badge bg-secondary ms-1">
                                Mediator
                              </span>
                            )}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* FOOTER */}
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowResolveModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-success"
                  onClick={handleResolveConfirm}
                  disabled={!selectedFinder || resolving || chatParticipants.length === 0}
                >
                  {resolving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Resolving…
                    </>
                  ) : (
                    "✔ Confirm & Award Points"
                  )}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
      {/* ── END RESOLVE CONFIRMATION MODAL ──────────────────────── */}

    </div>
  );
}

export default Dashboard;