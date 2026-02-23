import { useState } from "react";
import axios from "axios";

function Login() {
  const [role, setRole] = useState("student");
  const [rollNumber, setRollNumber] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const payload =
        role === "student"
          ? { role, rollNumber, password }
          : { role, name, password };

      const res = await axios.post(
        "http://localhost:5000/api/auth/login",
        payload
      );

      localStorage.setItem("token", res.data.token);
      alert("Login Successful!");
    } catch (error) {
      alert("Login Failed");
    }
  };

  return (
    <div className="vh-100 d-flex justify-content-center align-items-center bg-light">
      <div className="card shadow p-4" style={{ width: "400px" }}>
        <h3 className="text-center mb-4 text-primary">
          Campus Lost & Found
        </h3>

        <form onSubmit={handleLogin}>

          <div className="mb-3">
            <label className="form-label">Login As</label>
            <select
              className="form-select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
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
            />
          </div>

          <button type="submit" className="btn btn-primary w-100">
            Login
          </button>

          <p className="text-center mt-3">
            Don't have an account?{" "}
            <a href="/signup" className="text-decoration-none">
                Signup
            </a>
          </p>

        </form>
      </div>
    </div>
  );
}

export default Login;