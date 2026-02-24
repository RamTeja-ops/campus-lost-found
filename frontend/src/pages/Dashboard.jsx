import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showAbout, setShowAbout] = useState(false);
  const [showContact, setShowContact] = useState(false);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const userInfo = token
    ? JSON.parse(atob(token.split(".")[1]))
    : null;

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/lostitems",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setItems(res.data);
    } catch (error) {
      console.log("Error fetching items");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
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
            {localStorage.getItem("displayName")}
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
              This platform helps students and faculty
              report and recover lost items across campus
              efficiently and securely.
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
          <button className="btn btn-success">
            <button
                className="btn btn-success"
                onClick={() => navigate("/add-item")}
                >
                + Add Lost Item
            </button>
          </button>
        </div>

        <div className="row justify-content-center">
          <div className="col-lg-8">

            {items.map((item) => (
            <div
                key={item._id}
                className="card shadow-sm mb-4"
                style={{ cursor: "pointer" }}
                onClick={() => setSelectedItem(item)}
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

                    <p className="text-muted mb-2">
                        {item.description}
                    </p>

                    <p className="mb-1">
                        <strong>Location:</strong> {item.location}
                    </p>

                    <p className="mb-1">
                        <strong>Date Found:</strong>{" "}
                        {new Date(item.dateFound).toLocaleDateString()}
                    </p>

                    {item.facultyMediator && (
                        <p className="mb-1">
                        <strong>Faculty Mediator:</strong> {item.facultyMediator}
                        </p>
                    )}

                    <small className="text-secondary">
                        Submitted by:{" "}
                        {item.submittedBy?.rollNumber ||
                        item.submittedBy?.name}
                    </small>

                    </div>
                </div>

                </div>
            </div>
            ))}

          </div>
        </div>

      </div>

      {/* MODAL */}
      <div
        className="modal fade"
        id="itemModal"
        tabIndex="-1"
      >
        <div className="modal-dialog">
          <div className="modal-content">

            {selectedItem && (
              <>
                <div className="modal-header">
                  <h5 className="modal-title">
                    {selectedItem.itemName}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    data-bs-dismiss="modal"
                  ></button>
                </div>

                <div className="modal-body">
                  <p><strong>Description:</strong> {selectedItem.description}</p>
                  <p><strong>Location:</strong> {selectedItem.location}</p>
                  <p>
                    <strong>Status:</strong>{" "}
                    <span
                      className={`badge ${
                        selectedItem.status === "active"
                          ? "bg-warning text-dark"
                          : "bg-success"
                      }`}
                    >
                      {selectedItem.status}
                    </span>
                  </p>

                  <p>
                    <strong>Submitted By:</strong>{" "}
                    {selectedItem.submittedBy?.rollNumber ||
                      selectedItem.submittedBy?.name}
                  </p>
                </div>

                <div className="modal-footer">
                  <button className="btn btn-primary">
                    Open Chat
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      </div>

    </div>
  );
}

export default Dashboard;