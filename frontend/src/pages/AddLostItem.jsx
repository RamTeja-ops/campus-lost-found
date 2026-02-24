import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function AddLostItem() {
  const [itemName, setItemName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [dateFound, setDateFound] = useState("");
  const [facultyMediator, setFacultyMediator] = useState("");
  const [image, setImage] = useState(null);

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      const formData = new FormData();

        formData.append("itemName", itemName);
        formData.append("description", description);
        formData.append("location", location);
        formData.append("dateFound", dateFound);

      if (role === "student") {
        formData.append("facultyMediator", facultyMediator);
      }

        formData.append("image", image);
        console.log("FORM DATA DEBUG:");

        for (let pair of formData.entries()) {
        console.log(pair[0], pair[1]);
        }

        await axios.post(
        "http://localhost:5000/api/lostitems",
        formData,
        {
            headers: {
            Authorization: `Bearer ${token}`,
            },
        }
        );

      alert("Lost Item Added Successfully!");
      navigate("/dashboard");

    }catch (error) {
        console.log("FULL ERROR:", error);
        console.log("RESPONSE:", error.response);
        console.log("DATA:", error.response?.data);

        alert(
            error.response?.data?.message || "Failed to add item"
        );
    }

    setLoading(false);
  };

  return (
    <div className="container mt-5">
      <div className="card shadow p-4">
        <h3 className="text-center mb-4 text-success">
          Add Lost Item
        </h3>

        <form onSubmit={handleSubmit}>

          <div className="mb-3">
            <label className="form-label">Item Name</label>
            <input
              type="text"
              className="form-control"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Description</label>
            <textarea
              className="form-control"
              rows="3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Location Found</label>
            <input
              type="text"
              className="form-control"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Date Found</label>
            <input
              type="date"
              className="form-control"
              value={dateFound}
              onChange={(e) => setDateFound(e.target.value)}
              required
            />
          </div>

          {role === "student" && (
            <div className="mb-3">
              <label className="form-label">
                Faculty Mediator Name
              </label>
              <input
                type="text"
                className="form-control"
                value={facultyMediator}
                onChange={(e) =>
                  setFacultyMediator(e.target.value)
                }
                required
              />
            </div>
          )}

          <div className="mb-3">
            <label className="form-label">Upload Image</label>
            <input
              type="file"
              className="form-control"
              accept="image/*"
              onChange={(e) => setImage(e.target.files[0])}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-success w-100"
            disabled={loading}
          >
            {loading ? "Uploading..." : "Add Item"}
          </button>

        </form>
      </div>
    </div>
  );
}

export default AddLostItem;