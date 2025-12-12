import React, { useState, FormEvent, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();

  const handleLogin = () => {
    if (!username || !password) {
      setError("⚠️ Username and Password required");
      return;
    }

    // simple hard-coded check (keeps credentials client-side as requested)
    if (username.trim() === "temp" && password.trim() === "temp") {
      navigate('/dashboard')
    } else {
      setError("❌ Invalid credentials");
    }
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleLogin();
  };

  const onUsernameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
    if (error) setError("");
  };

  const onPasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (error) setError("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white via-[#f7eeda] to-[#f0e6d2] p-6">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl flex overflow-hidden animate-fade-in">
        {/* Left Side - Image */}
        <div className="w-1/2 bg-white flex items-center justify-center p-8">
          <img
            src="https://res.cloudinary.com/dcmt06mac/image/upload/v1765447413/admin-login_qmro9s.webp"
            alt="Login"
            className="w-[85%] max-w-md"
          />
        </div>

        {/* Right Side - Login Form */}
        <div className="w-1/2 flex flex-col justify-center items-center px-10 py-14 bg-white">
          <h2 className="text-3xl font-bold text-orange-700 mb-2">Admin Credentials Login</h2>

          <form className="w-full max-w-sm mt-4 space-y-6" onSubmit={onSubmit}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={onUsernameChange}
              className="w-[40%] mx-auto block h-12 rounded-full bg-gray-100 px-5 text-center shadow focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder-gray-500"
              aria-label="username"
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={onPasswordChange}
              className="w-[40%] mx-auto block h-12 rounded-full bg-gray-100 px-5 text-center shadow focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder-gray-500"
              aria-label="password"
            />

            <div className="flex justify-between w-[85%] mx-auto text-sm text-gray-500">
              <label className="flex items-center gap-1">
                <input type="checkbox" className="accent-orange-500" /> Remember
              </label>
              <span className="hover:underline cursor-pointer">Forgot Password?</span>
            </div>

            {error && <div className="text-center text-red-600 font-medium -mt-4">{error}</div>}

            <button
              type="submit"
              className="
                flex justify-center items-center
                bg-blue-600 text-white font-semibold
                px-5 py-2 rounded-md
                shadow-glow
                transition-all duration-300
                hover:bg-blue-500/80 hover:shadow-xl
              "
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
