import { useState, useEffect } from "react";
import "./App.css";

interface User {
  username: string;
  avatar_url: string;
  user_id: number;
  access_token: string;
}

function App() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check if GitHub redirected back with a token in URL
    const params = new URLSearchParams(window.location.search);
    const token = params.get("access_token");
    const username = params.get("username");
    const avatar_url = params.get("avatar_url");
    const user_id = params.get("user_id");

    if (token && username && avatar_url && user_id) {
      const userData = { access_token: token, username, avatar_url, user_id: parseInt(user_id) };
      setUser(userData);
      localStorage.setItem("autoscribe_user", JSON.stringify(userData));
      // Clean up URL
      window.history.replaceState({}, "", "/");
    } else {
      // Check localStorage
      const saved = localStorage.getItem("autoscribe_user");
      if (saved) setUser(JSON.parse(saved));
    }
  }, []);

  const handleLogin = () => {
    window.location.href = "http://localhost:8000/api/v1/auth/github/login";
  };

  const handleLogout = () => {
    localStorage.removeItem("autoscribe_user");
    setUser(null);
  };

  return (
    <div className="app">
      {!user ? (
        <div className="login-box">
          <h1>AutoScribe</h1>
          <p>AI-powered documentation for your GitHub repos</p>
          <button onClick={handleLogin} className="github-btn">
            Login with GitHub
          </button>
        </div>
      ) : (
        <div className="dashboard">
          <div className="navbar">
            <h2>AutoScribe</h2>
            <div className="user-info">
              <img src={user.avatar_url} alt="avatar" width={32} height={32} />
              <span>{user.username}</span>
              <button onClick={handleLogout}>Logout</button>
            </div>
          </div>
          <div className="content">
            <h3>Welcome, {user.username}! 👋</h3>
            <p>Your account is connected. Repository management coming next.</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;