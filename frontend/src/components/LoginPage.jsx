import React, { useState } from "react";
import './LoginPage.css';
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({username: '', password: ''});
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch("http://localhost:5000/auth/login", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                navigate("/dashboard");
            } else {
                setError(data.message || "Login failed");
            }
        } catch (err) {
            console.error(err);
            setError("Server error");
        }
    };

    return (
        <div className="login-page">
            {/* left panel */}
            <div className="login-left">
                <h1> Welcome!</h1>
                <p>Join our community in tracking your finances in a managable way !</p>
                <button type="button" onClick={() => navigate("/register")}>Sign Up</button>
                <img src="https://img.icons8.com/fluency/96/money-bag.png" alt="finance-icon" />
            </div>

            {/* right section */}
            <div className="login-right">
                <div className="login-card">
                    <h2>Sign In</h2>
                    <form className="login-form" onSubmit={handleSubmit} >
                        <input type="text" name="username" placeholder="Username" value={formData.username} onChange={handleChange} required />
                        <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required />
                        <button type="submit">Sign In</button>
                        {error && <p className="error-message">{error}</p>}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;