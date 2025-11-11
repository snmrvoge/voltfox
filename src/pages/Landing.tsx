import React from "react";
import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div style={{ minHeight: "100vh", background: "#FFF8F3" }}>
      {/* Hero Section */}
      <div style={{
        background: "linear-gradient(135deg, #FF6B35 0%, #FFD23F 100%)",
        color: "white",
        padding: "4rem 2rem",
        textAlign: "center"
      }}>
        {/* Mr. Vision Badge */}
        <div style={{
          display: "inline-block",
          background: "rgba(255,255,255,0.2)",
          padding: "8px 16px",
          borderRadius: "50px",
          marginBottom: "2rem"
        }}>
          ⭐ Created by Mr. Vision ⭐
        </div>

        <h1 style={{ fontSize: "4rem", margin: "1rem 0" }}>🦊 VoltFox</h1>
        <p style={{ fontSize: "1.5rem", fontWeight: "bold" }}>Stay Foxy, Stay Charged</p>
        <h2 style={{ fontSize: "2rem", margin: "2rem 0" }}>Never Lose a Device to Dead Batteries</h2>
        <p style={{ fontSize: "1.1rem", maxWidth: "600px", margin: "0 auto 2rem" }}>
          The smart fox watches over your batteries 24/7 with AI-powered predictions and instant alerts.
        </p>

        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link to="/signup" style={{
            padding: "1rem 2rem",
            background: "white",
            color: "#FF6B35",
            textDecoration: "none",
            borderRadius: "50px",
            fontWeight: "bold",
            fontSize: "1.1rem"
          }}>
            Start Free Monitoring →
          </Link>
          <Link to="/demo" style={{
            padding: "1rem 2rem",
            background: "rgba(255,255,255,0.2)",
            color: "white",
            textDecoration: "none",
            borderRadius: "50px",
            fontWeight: "bold",
            border: "2px solid white"
          }}>
            Watch Demo
          </Link>
        </div>

        {/* Stats */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "2rem",
          maxWidth: "600px",
          margin: "3rem auto 0"
        }}>
          <div>
            <div style={{ fontSize: "2rem", fontWeight: "bold" }}>50k+</div>
            <div>Batteries</div>
          </div>
          <div>
            <div style={{ fontSize: "2rem", fontWeight: "bold" }}>2k+</div>
            <div>Saved</div>
          </div>
          <div>
            <div style={{ fontSize: "2rem", fontWeight: "bold" }}>4.9</div>
            <div>Rating</div>
          </div>
          <div>
            <div style={{ fontSize: "2rem", fontWeight: "bold" }}>24/7</div>
            <div>Monitoring</div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div style={{ padding: "4rem 2rem", background: "white" }}>
        <h2 style={{ textAlign: "center", fontSize: "2.5rem", color: "#2E3A4B", marginBottom: "3rem" }}>
          Why VoltFox?
        </h2>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "2rem",
          maxWidth: "1200px",
          margin: "0 auto"
        }}>
          <div style={{ textAlign: "center", padding: "2rem", background: "#FFF8F3", borderRadius: "15px" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔋</div>
            <h3 style={{ color: "#2E3A4B", marginBottom: "0.5rem" }}>Smart Monitoring</h3>
            <p style={{ color: "#666" }}>AI-powered predictions keep your batteries healthy</p>
          </div>
          <div style={{ textAlign: "center", padding: "2rem", background: "#FFF8F3", borderRadius: "15px" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚡</div>
            <h3 style={{ color: "#2E3A4B", marginBottom: "0.5rem" }}>Instant Alerts</h3>
            <p style={{ color: "#666" }}>Get notified before problems arise</p>
          </div>
          <div style={{ textAlign: "center", padding: "2rem", background: "#FFF8F3", borderRadius: "15px" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🛡️</div>
            <h3 style={{ color: "#2E3A4B", marginBottom: "0.5rem" }}>Device Protection</h3>
            <p style={{ color: "#666" }}>Save expensive equipment from battery damage</p>
          </div>
          <div style={{ textAlign: "center", padding: "2rem", background: "#FFF8F3", borderRadius: "15px" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📊</div>
            <h3 style={{ color: "#2E3A4B", marginBottom: "0.5rem" }}>Health Analytics</h3>
            <p style={{ color: "#666" }}>Track battery performance over time</p>
          </div>
          <div style={{ textAlign: "center", padding: "2rem", background: "#FFF8F3", borderRadius: "15px" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>👥</div>
            <h3 style={{ color: "#2E3A4B", marginBottom: "0.5rem" }}>Community Data</h3>
            <p style={{ color: "#666" }}>Learn from millions of battery data points</p>
          </div>
          <div style={{ textAlign: "center", padding: "2rem", background: "#FFF8F3", borderRadius: "15px" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>💰</div>
            <h3 style={{ color: "#2E3A4B", marginBottom: "0.5rem" }}>Insurance Ready</h3>
            <p style={{ color: "#666" }}>Document device values for coverage</p>
          </div>
        </div>
      </div>

      {/* How it Works */}
      <div style={{ padding: "4rem 2rem", background: "#FFF8F3" }}>
        <h2 style={{ textAlign: "center", fontSize: "2.5rem", color: "#2E3A4B", marginBottom: "3rem" }}>
          Simple as 1-2-3
        </h2>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "2rem",
          maxWidth: "900px",
          margin: "0 auto"
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{
              width: "60px",
              height: "60px",
              background: "linear-gradient(135deg, #FF6B35 0%, #FFD23F 100%)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1rem",
              color: "white",
              fontSize: "1.5rem",
              fontWeight: "bold"
            }}>1</div>
            <h3 style={{ color: "#2E3A4B" }}>Add Your Devices</h3>
            <p style={{ color: "#666" }}>Phones, drones, tools - anything with a battery</p>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{
              width: "60px",
              height: "60px",
              background: "linear-gradient(135deg, #FF6B35 0%, #FFD23F 100%)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1rem",
              color: "white",
              fontSize: "1.5rem",
              fontWeight: "bold"
            }}>2</div>
            <h3 style={{ color: "#2E3A4B" }}>Get Smart Alerts</h3>
            <p style={{ color: "#666" }}>AI learns your patterns and notifies you</p>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{
              width: "60px",
              height: "60px",
              background: "linear-gradient(135deg, #FF6B35 0%, #FFD23F 100%)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1rem",
              color: "white",
              fontSize: "1.5rem",
              fontWeight: "bold"
            }}>3</div>
            <h3 style={{ color: "#2E3A4B" }}>Save Your Devices</h3>
            <p style={{ color: "#666" }}>Never lose equipment to dead batteries</p>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div style={{ padding: "4rem 2rem", background: "white" }}>
        <h2 style={{ textAlign: "center", fontSize: "2.5rem", color: "#2E3A4B", marginBottom: "3rem" }}>
          Simple Pricing
        </h2>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "2rem",
          maxWidth: "900px",
          margin: "0 auto"
        }}>
          <div style={{
            padding: "2rem",
            border: "2px solid #E5E7EB",
            borderRadius: "15px",
            textAlign: "center"
          }}>
            <h3 style={{ color: "#2E3A4B", fontSize: "1.5rem" }}>Free</h3>
            <div style={{ fontSize: "2.5rem", fontWeight: "bold", color: "#FF6B35", margin: "1rem 0" }}>
              CHF 0<span style={{ fontSize: "1rem", color: "#666" }}>/month</span>
            </div>
            <ul style={{ listStyle: "none", padding: 0, color: "#666" }}>
              <li style={{ padding: "0.5rem 0" }}>✓ Up to 5 devices</li>
              <li style={{ padding: "0.5rem 0" }}>✓ Basic monitoring</li>
              <li style={{ padding: "0.5rem 0" }}>✓ Email alerts</li>
            </ul>
            <Link to="/signup" style={{
              display: "block",
              padding: "0.75rem",
              background: "#FFF8F3",
              color: "#FF6B35",
              textDecoration: "none",
              borderRadius: "25px",
              marginTop: "1rem",
              fontWeight: "bold"
            }}>
              Start Free
            </Link>
          </div>
          
          <div style={{
            padding: "2rem",
            border: "2px solid #FF6B35",
            borderRadius: "15px",
            textAlign: "center",
            position: "relative"
          }}>
            <div style={{
              position: "absolute",
              top: "-12px",
              left: "50%",
              transform: "translateX(-50%)",
              background: "linear-gradient(135deg, #FF6B35 0%, #FFD23F 100%)",
              color: "white",
              padding: "4px 16px",
              borderRadius: "20px",
              fontSize: "0.85rem",
              fontWeight: "bold"
            }}>POPULAR</div>
            <h3 style={{ color: "#2E3A4B", fontSize: "1.5rem" }}>Pro</h3>
            <div style={{ fontSize: "2.5rem", fontWeight: "bold", color: "#FF6B35", margin: "1rem 0" }}>
              CHF 9<span style={{ fontSize: "1rem", color: "#666" }}>/month</span>
            </div>
            <ul style={{ listStyle: "none", padding: 0, color: "#666" }}>
              <li style={{ padding: "0.5rem 0" }}>✓ Unlimited devices</li>
              <li style={{ padding: "0.5rem 0" }}>✓ AI predictions</li>
              <li style={{ padding: "0.5rem 0" }}>✓ Push notifications</li>
              <li style={{ padding: "0.5rem 0" }}>✓ Insurance reports</li>
            </ul>
            <Link to="/signup" style={{
              display: "block",
              padding: "0.75rem",
              background: "linear-gradient(135deg, #FF6B35 0%, #FFD23F 100%)",
              color: "white",
              textDecoration: "none",
              borderRadius: "25px",
              marginTop: "1rem",
              fontWeight: "bold"
            }}>
              Start Pro Trial
            </Link>
          </div>

          <div style={{
            padding: "2rem",
            border: "2px solid #E5E7EB",
            borderRadius: "15px",
            textAlign: "center"
          }}>
            <h3 style={{ color: "#2E3A4B", fontSize: "1.5rem" }}>Business</h3>
            <div style={{ fontSize: "2.5rem", fontWeight: "bold", color: "#FF6B35", margin: "1rem 0" }}>
              CHF 49<span style={{ fontSize: "1rem", color: "#666" }}>/month</span>
            </div>
            <ul style={{ listStyle: "none", padding: 0, color: "#666" }}>
              <li style={{ padding: "0.5rem 0" }}>✓ Everything in Pro</li>
              <li style={{ padding: "0.5rem 0" }}>✓ Team management</li>
              <li style={{ padding: "0.5rem 0" }}>✓ API access</li>
            </ul>
            <Link to="/contact" style={{
              display: "block",
              padding: "0.75rem",
              background: "#FFF8F3",
              color: "#FF6B35",
              textDecoration: "none",
              borderRadius: "25px",
              marginTop: "1rem",
              fontWeight: "bold"
            }}>
              Contact Sales
            </Link>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div style={{
        background: "linear-gradient(135deg, #FF6B35 0%, #FFD23F 100%)",
        color: "white",
        padding: "4rem 2rem",
        textAlign: "center"
      }}>
        <h2 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>Ready to Stay Foxy?</h2>
        <p style={{ fontSize: "1.2rem", marginBottom: "2rem" }}>
          Join thousands who never worry about dead batteries
        </p>
        <Link to="/signup" style={{
          display: "inline-block",
          padding: "1rem 2rem",
          background: "white",
          color: "#FF6B35",
          textDecoration: "none",
          borderRadius: "50px",
          fontWeight: "bold",
          fontSize: "1.1rem"
        }}>
          Start Free Monitoring →
        </Link>
        <p style={{ marginTop: "1rem", fontSize: "0.9rem", opacity: 0.9 }}>
          No credit card required • 2 minute setup
        </p>
        
        <div style={{ marginTop: "3rem", paddingTop: "2rem", borderTop: "1px solid rgba(255,255,255,0.3)" }}>
          <p style={{ fontSize: "1.1rem" }}>
            Crafted with ❤️ and ⚡ by <strong>Mr. Vision</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
