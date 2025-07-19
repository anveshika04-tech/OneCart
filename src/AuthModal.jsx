import React, { useState } from "react";
import axios from "axios";

const AuthModal = ({ onAuthSuccess }) => {
  const [isSignup, setIsSignup] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError("");
    try {
      const url = isSignup ? "/api/auth/signup" : "/api/auth/login";
      const payload = isSignup ? form : { email: form.email, password: form.password };
      const res = await axios.post(url, payload);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      localStorage.setItem("token", res.data.token);
      onAuthSuccess(res.data.user);
    } catch (err) {
      setError(err.response?.data?.error || "Auth failed");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg w-80 flex flex-col gap-3">
        <h2 className="text-xl font-bold mb-2">{isSignup ? "Sign Up" : "Log In"}</h2>
        {isSignup && (
          <input
            name="name"
            placeholder="Name"
            className="p-2 border rounded"
            value={form.name}
            onChange={handleChange}
            required
          />
        )}
        <input
          name="email"
          type="email"
          placeholder="Email"
          className="p-2 border rounded"
          value={form.email}
          onChange={handleChange}
          required
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          className="p-2 border rounded"
          value={form.password}
          onChange={handleChange}
          required
        />
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <button className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600" type="submit">
          {isSignup ? "Sign Up" : "Log In"}
        </button>
        <button
          type="button"
          className="text-blue-500 text-sm mt-2"
          onClick={() => { setIsSignup(!isSignup); setError(""); }}
        >
          {isSignup ? "Already have an account? Log In" : "No account? Sign Up"}
        </button>
      </form>
    </div>
  );
};

export default AuthModal; 