import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Profile() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const displayName = localStorage.getItem("displayName");
  const role = localStorage.getItem("role");

  const [contributions, setContributions] = useState([]);
  const [myRanking, setMyRanking]         = useState(null);
  const [loading, setLoading]             = useState(true);

  // ── Change password state ─────────────────────────────────────
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword]   = useState("");
  const [newPassword, setNewPassword]           = useState("");
  const [pwMessage, setPwMessage]               = useState("");
  const [pwError, setPwError]                   = useState("");
  const [pwLoading, setPwLoading]               = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // fetch contributions (resolved items submitted by me)
      const contribRes = await axios.get(
        "http://localhost:5000/api/auth/my-contributions",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setContributions(contribRes.data);

      // fetch rankings to find my points + rank
      const rankRes = await axios.get(
        "http://localhost:5000/api/auth/rankings",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const me = rankRes.data.find(
        (u) => u.rollNumber === displayName || u.name === displayName
      );
      setMyRanking(me || null);
    } catch (err) {
      console.log("Error loading profile data");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwMessage(""); setPwError("");
    setPwLoading(true);
    try {
      await axios.put(
        "http://localhost:5000/api/auth/profile",
        { currentPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPwMessage("✅ Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setShowPasswordForm(false);
    } catch (err) {
      setPwError(err.response?.data?.message || "Failed to change password.");
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div>

      {/* NAVBAR — same style as Dashboard */}
      <nav className="navbar navbar-dark bg-dark px-4">
        <span
          className="navbar-brand fw-bold"
          style={{ cursor: "pointer" }}
          onClick={() => navigate("/dashboard")}
        >
          Campus Lost & Found
        </span>
        <button
          className="btn btn-outline-light btn-sm"
          onClick={() => navigate("/dashboard")}
        >
          ← Back to Dashboard
        </button>
      </nav>

      <div className="container mt-5" style={{ maxWidth: "860px" }}>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-success" />
            <p className="mt-2 text-muted">Loading profile…</p>
          </div>
        ) : (
          <>
            {/* ── PROFILE CARD ─────────────────────────────── */}
            <div className="card shadow-sm mb-4">
              <div className="card-body d-flex align-items-center gap-4 p-4">

                {/* Avatar circle */}
                <div
                  className="d-flex align-items-center justify-content-center rounded-circle bg-success text-white fw-bold"
                  style={{ width: "80px", height: "80px", fontSize: "2rem", flexShrink: 0 }}
                >
                  {displayName?.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-grow-1">
                  <span
                    className={`badge mb-2 ${role === "faculty" ? "bg-primary" : "bg-warning text-dark"}`}
                  >
                    {role === "faculty" ? "👨‍🏫 Faculty" : "🎓 Student"}
                  </span>

                  <h4 className="fw-bold mb-1">{displayName}</h4>

                  <p className="text-muted mb-0" style={{ fontSize: "0.9rem" }}>
                    {role === "student" ? "Roll Number" : "Name"}: <strong>{displayName}</strong>
                  </p>
                </div>

                {/* Stats */}
                <div className="d-flex gap-3">
                  <div
                    className="text-center px-4 py-3 rounded"
                    style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}
                  >
                    <div className="fw-bold text-success" style={{ fontSize: "1.8rem" }}>
                      {myRanking?.points ?? 0}
                    </div>
                    <small className="text-muted">Total Points</small>
                  </div>

                  <div
                    className="text-center px-4 py-3 rounded"
                    style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}
                  >
                    <div className="fw-bold text-primary" style={{ fontSize: "1.8rem" }}>
                      {contributions.length}
                    </div>
                    <small className="text-muted">Items Resolved</small>
                  </div>
                </div>

              </div>
            </div>

            {/* ── CHANGE PASSWORD ──────────────────────────── */}
            <div className="card shadow-sm mb-4">
              <div
                className="card-header d-flex justify-content-between align-items-center"
                style={{ cursor: "pointer", background: "#f9fafb" }}
                onClick={() => setShowPasswordForm(!showPasswordForm)}
              >
                <span className="fw-bold">🔒 Change Password</span>
                <span>{showPasswordForm ? "▲" : "▼"}</span>
              </div>

              {showPasswordForm && (
                <div className="card-body">
                  <form onSubmit={handleChangePassword}>
                    <div className="mb-3">
                      <label className="form-label fw-bold">Current Password</label>
                      <input
                        type="password"
                        className="form-control"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-bold">New Password</label>
                      <input
                        type="password"
                        className="form-control"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                    </div>

                    {pwMessage && <div className="alert alert-success py-2">{pwMessage}</div>}
                    {pwError   && <div className="alert alert-danger  py-2">{pwError}</div>}

                    <button
                      type="submit"
                      className="btn btn-dark w-100"
                      disabled={pwLoading}
                    >
                      {pwLoading ? "Updating…" : "Update Password"}
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* ── CONTRIBUTIONS TABLE ──────────────────────── */}
            <div className="card shadow-sm mb-5">
              <div className="card-header" style={{ background: "#f9fafb" }}>
                <span className="fw-bold">📋 My Contributions</span>
                <small className="text-muted ms-2">
                  — Items you reported that got successfully resolved
                </small>
              </div>

              <div className="card-body p-0">
                {contributions.length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    <p className="mb-1">No contributions yet.</p>
                    <small>Report a found item and help someone recover it!</small>
                  </div>
                ) : (
                  <table className="table table-hover mb-0">
                    <thead className="table-dark">
                      <tr>
                        <th>#</th>
                        <th>Item Name</th>
                        <th>Description</th>
                        <th>Location</th>
                        <th>Date Found</th>
                        <th>Points Earned</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contributions.map((item, index) => (
                        <tr key={item._id}>
                          <td className="text-muted">{index + 1}</td>
                          <td className="fw-bold">{item.itemName}</td>
                          <td className="text-muted" style={{ maxWidth: "180px" }}>
                            <span
                              title={item.description}
                              style={{
                                display: "block",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap"
                              }}
                            >
                              {item.description}
                            </span>
                          </td>
                          <td>{item.location}</td>
                          <td>{new Date(item.dateFound).toLocaleDateString()}</td>
                          <td>
                            <span className="badge bg-success">
                              +{index < 5 ? 5 : 10} pts
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="table-light">
                      <tr>
                        <td colSpan="5" className="text-end fw-bold">Total Points</td>
                        <td>
                          <span className="fw-bold text-success">
                            {myRanking?.points ?? 0} pts
                          </span>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                )}
              </div>
            </div>

          </>
        )}
      </div>
    </div>
  );
}

export default Profile;