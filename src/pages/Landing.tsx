import React from "react";
import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div style={{ 
      minHeight: "100vh",
      background: "linear-gradient(135deg, #FF6B35 0%, #FFD23F 100%)",
      color: "white",
      textAlign: "center",
      padding: "2rem"
    }}>
      <div style={{
        display: "inline-block",
        background: "rgba(255,255,255,0.2)",
        padding: "8px 16px",
        borderRadius: "50px",
        marginTop: "2rem"
      }}>
        ⭐ Created by Mr. Vision ⭐
      </div>
      
      <h1 style={{ fontSize: "4rem", margin: "2rem 0" }}>
        🦊 VoltFox
      </h1>
      
      <p style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
        Stay Foxy, Stay Charged
      </p>
      
      <h2 style={{ fontSize: "2rem", margin: "2rem 0" }}>
        Never Lose a Device to Dead Batteries
      </h2>
      
      <Link to="/signup" style={{
        display: "inline-block",
        padding: "1rem 2rem",
        fontSize: "1.2rem",
        background: "white",
        color: "#FF6B35",
        textDecoration: "none",
        borderRadius: "50px",
        fontWeight: "bold",
        marginTop: "2rem"
      }}>
        Start Free Monitoring →
      </Link>
      
      <div style={{ marginTop: "4rem" }}>
        <p>Crafted with ❤️ by Mr. Vision</p>
      </div>
    </div>
  );
}
