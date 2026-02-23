import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Signup() {
  const navigate = useNavigate();

  const [role, setRole] = useState("student");
  const [rollNumber, setRollNumber] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage(
      "Confirming your credentials with college admin, please wait..."
    );

    // Fake 2 second delay for realism
    setTimeout(async () => {
      try {
        const payload =
          role === "student"
            ? { role, rollNumber, password }
            : { role, name, password };

        await axios.post(
          "http://localhost:5000/api/auth/signup",
          payload
        );

        setMessage("Signup Successful! Redirecting to login...");
        setTimeout(() => {
          navigate("/");
        }, 1500);

      } catch (error) {
        setMessage("Signup Failed. Please try again.");
        setLoading(false);
      }
    }, 2000);
  };

  return (
    <div className="vh-100 d-flex justify-content-center align-items-center bg-light">
      <div className="card shadow p-4" style={{ width: "400px" }}>
        <h3 className="text-center mb-4 text-success">
          Create Account
        </h3>

        <form onSubmit={handleSignup}>

          <div className="mb-3">
            <label className="form-label">Register As</label>
            <select
              className="form-select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={loading}
            >
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
            </select>
          </div>

          {role === "student" ? (
            <div className="mb-3">
              <label className="form-label">Roll Number</label>
              <input
                type="text"
                className="form-control"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          ) : (
            <div className="mb-3">
              <label className="form-label">Faculty Name</label>
              <input
                type="text"
                className="form-control"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          )}

          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="btn btn-success w-100"
            disabled={loading}
          >
            {loading ? "Please Wait..." : "Signup"}
          </button>

        </form>

        {message && (
          <div className="alert alert-info mt-3 text-center">
            {message}
          </div>
        )}

        <p className="text-center mt-3">
          Already have an account?{" "}
          <a href="/" className="text-decoration-none">
            Login
          </a>
        </p>

      </div>
    </div>
  );
}

export default Signup;