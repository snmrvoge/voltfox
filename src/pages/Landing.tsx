// src/pages/Landing.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Battery, Shield, Zap, TrendingUp, Users, Award, ArrowRight, Star, Check } from 'lucide-react';

const Landing: React.FC = () => {
  const stats = [
    { value: '50k+', label: 'Batteries Monitored' },
    { value: '2k+', label: 'Devices Saved' },
    { value: '4.9', label: 'App Rating' },
    { value: '24/7', label: 'Monitoring' }
  ];

  const features = [
    {
      icon: <Battery className="w-6 h-6" />,
      title: 'Smart Monitoring',
      description: 'AI-powered predictions keep your batteries healthy'
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Device Protection',
      description: 'Never lose a device to dead batteries again'
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Instant Alerts',
      description: 'Get notified before problems arise'
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: 'Health Analytics',
      description: 'Track battery performance over time'
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Community Insights',
      description: 'Learn from millions of battery data points'
    },
    {
      icon: <Award className="w-6 h-6" />,
      title: 'Insurance Ready',
      description: 'Document your device values for coverage'
    }
  ];

  const testimonials = [
    {
      text: "VoltFox saved my DJI Mavic from crashing! Got the alert just in time.",
      author: "Sarah M.",
      role: "Drone Pilot"
    },
    {
      text: "Finally, an app that actually helps. My e-bike batteries last 40% longer now.",
      author: "Mike T.",
      role: "E-Bike Enthusiast"
    },
    {
      text: "The fox is always watching! Love the smart predictions.",
      author: "Anna K.",
      role: "Photographer"
    }
  ];

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background">
          <div className="gradient-orb gradient-orb-1"></div>
          <div className="gradient-orb gradient-orb-2"></div>
        </div>
        
        <div className="container">
          <motion.div 
            className="hero-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="hero-badge">
              <Star className="w-4 h-4" />
              <span>Created by Mr. Vision</span>
              <Star className="w-4 h-4" />
            </div>
            
            <h1 className="hero-title">
              <span className="fox-emoji">🦊</span>
              <span className="gradient-text">VoltFox</span>
            </h1>
            
            <p className="hero-tagline">Stay Foxy, Stay Charged</p>
            
            <h2 className="hero-subtitle">
              Never Lose a Device to Dead Batteries
            </h2>
            
            <p className="hero-description">
              The smart fox watches over your batteries 24/7 with AI-powered predictions 
              and instant alerts. Join 50,000+ users who never worry about dead batteries.
            </p>
            
            <div className="hero-actions">
              <Link to="/signup" className="btn btn-primary btn-large">
                Start Free Monitoring
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link to="/demo" className="btn btn-secondary btn-large">
                Watch Demo
              </Link>
            </div>
            
            <div className="hero-stats">
              {stats.map((stat, index) => (
                <motion.div 
                  key={index}
                  className="stat-item"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <span className="stat-value">{stat.value}</span>
                  <span className="stat-label">{stat.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <motion.div 
            className="section-header"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="section-title">Why VoltFox?</h2>
            <p className="section-subtitle">
              Everything you need to keep your batteries healthy and devices running
            </p>
          </motion.div>
          
          <div className="features-grid">
            {features.map((feature, index) => (
              <motion.div 
                key={index}
                className="feature-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="feature-icon">
                  {feature.icon}
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <div className="container">
          <motion.div 
            className="section-header"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="section-title">Simple as 1-2-3</h2>
            <p className="section-subtitle">Get started in minutes</p>
          </motion.div>
          
          <div className="steps">
            <motion.div 
              className="step"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="step-number">1</div>
              <h3>Add Your Devices</h3>
              <p>Tell VoltFox about your batteries - phones, drones, tools, anything!</p>
            </motion.div>
            
            <motion.div 
              className="step"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <div className="step-number">2</div>
              <h3>Get Smart Alerts</h3>
              <p>Our AI learns your patterns and alerts you before issues arise</p>
            </motion.div>
            
            <motion.div 
              className="step"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <div className="step-number">3</div>
              <h3>Save Your Devices</h3>
              <p>Never lose expensive equipment to preventable battery failures</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials-section">
        <div className="container">
          <motion.div 
            className="section-header"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="section-title">Loved by Users Worldwide</h2>
          </motion.div>
          
          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <motion.div 
                key={index}
                className="testimonial-card"
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="testimonial-stars">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="star-icon" />
                  ))}
                </div>
                <p className="testimonial-text">"{testimonial.text}"</p>
                <div className="testimonial-author">
                  <strong>{testimonial.author}</strong>
                  <span>{testimonial.role}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="pricing-section">
        <div className="container">
          <motion.div 
            className="section-header"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="section-title">Simple, Transparent Pricing</h2>
            <p className="section-subtitle">Start free, upgrade when you need more</p>
          </motion.div>
          
          <div className="pricing-grid">
            <motion.div 
              className="pricing-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h3 className="pricing-title">Free</h3>
              <div className="pricing-price">
                <span className="currency">CHF</span>
                <span className="amount">0</span>
                <span className="period">/month</span>
              </div>
              <ul className="pricing-features">
                <li><Check className="w-4 h-4" /> Up to 5 devices</li>
                <li><Check className="w-4 h-4" /> Basic monitoring</li>
                <li><Check className="w-4 h-4" /> Email alerts</li>
                <li><Check className="w-4 h-4" /> 7-day history</li>
              </ul>
              <Link to="/signup" className="btn btn-secondary btn-block">
                Start Free
              </Link>
            </motion.div>
            
            <motion.div 
              className="pricing-card pricing-featured"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <div className="pricing-badge">Most Popular</div>
              <h3 className="pricing-title">Pro</h3>
              <div className="pricing-price">
                <span className="currency">CHF</span>
                <span className="amount">9</span>
                <span className="period">/month</span>
              </div>
              <ul className="pricing-features">
                <li><Check className="w-4 h-4" /> Unlimited devices</li>
                <li><Check className="w-4 h-4" /> AI predictions</li>
                <li><Check className="w-4 h-4" /> Push notifications</li>
                <li><Check className="w-4 h-4" /> Full history</li>
                <li><Check className="w-4 h-4" /> Insurance reports</li>
                <li><Check className="w-4 h-4" /> Priority support</li>
              </ul>
              <Link to="/signup" className="btn btn-primary btn-block">
                Start Pro Trial
              </Link>
            </motion.div>
            
            <motion.div 
              className="pricing-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="pricing-title">Business</h3>
              <div className="pricing-price">
                <span className="currency">CHF</span>
                <span className="amount">49</span>
                <span className="period">/month</span>
              </div>
              <ul className="pricing-features">
                <li><Check className="w-4 h-4" /> Everything in Pro</li>
                <li><Check className="w-4 h-4" /> Team management</li>
                <li><Check className="w-4 h-4" /> API access</li>
                <li><Check className="w-4 h-4" /> Custom integrations</li>
                <li><Check className="w-4 h-4" /> SLA guarantee</li>
                <li><Check className="w-4 h-4" /> Dedicated support</li>
              </ul>
              <Link to="/contact" className="btn btn-secondary btn-block">
                Contact Sales
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <motion.div 
            className="cta-content"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="cta-title">Ready to Stay Foxy?</h2>
            <p className="cta-subtitle">
              Join thousands who never worry about dead batteries
            </p>
            <Link to="/signup" className="btn btn-white btn-large">
              Start Free Monitoring
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <p className="cta-note">
              No credit card required • 2 minute setup • Cancel anytime
            </p>
            
            {/* Mr. Vision Credit */}
            <div className="creator-credit">
              <p className="credit-text">
                Crafted with ❤️ and ⚡ by <span className="credit-name">Mr. Vision</span>
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Landing;