import React, { useState }  from "react";
import './RegistrationPage.css';
import { useNavigate } from "react-router-dom";

const RegistrationPage = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = React.useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: ""
    });

    const [error, setError] = React.useState("");

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
        return;
    }
    
    try {
        const response = await fetch("http://localhost:5000/auth/register", {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username: formData.username,
                email: formData.email,
                password: formData.password,
                confirm_password: formData.confirmPassword,
            })
        });

        const data = await response.json();

        if (response.ok) {
            alert("Registration successful");
            navigate("/login");
        } else {
            setError(data.message || "Registration failed"); 
        }
    } catch (err) {
        console.error(err);
        setError("Server error");
        }
    };

    return (
        <div className="registration-page">
            {/* Left section */}
            <div className="registration-left">
                <h1>Welcome Back</h1>
                <p>Welcome back our esteemed customer</p>
                <button type="button" onClick={() => navigate("/login")}>Sign In</button>
                <img src="https://img.icons8.com/fluency/96/money-bag.png" alt="finance-icon" />
            </div>

            {/* Right section */}
            <div className="registration-right">
                <div className="registration-card">
                    <h2>Create Account</h2>
                    <form className="registration-form" onSubmit={handleSubmit}>
                        <input type="text" name="username" placeholder="Username" value={formData.username} onChange={handleChange} required />
                        <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
                        <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required />
                        <input type="password" name="confirmPassword" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} required />
                        <button type="submit">Sign Up</button>
                        {error && <p className="error-message">{error}</p>}
                    </form>
                </div>
            </div>
            
        </div>
    );
};

export default RegistrationPage;