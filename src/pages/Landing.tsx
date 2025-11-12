// src/pages/Landing.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Battery, Shield, Zap, TrendingUp, Users, Award, ArrowRight, Star, Check } from 'lucide-react';

const Landing: React.FC = () => {
  const { t } = useTranslation();

  const stats = [
    { value: '50k+', label: t('landing.stats.monitored') },
    { value: '2k+', label: t('landing.stats.saved') },
    { value: '4.9', label: t('landing.stats.rating') },
    { value: '24/7', label: t('landing.stats.monitoring') }
  ];

  const features = [
    {
      icon: <Battery className="w-6 h-6" />,
      title: t('landing.features.smartMonitoring.title'),
      description: t('landing.features.smartMonitoring.description')
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: t('landing.features.deviceProtection.title'),
      description: t('landing.features.deviceProtection.description')
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: t('landing.features.instantAlerts.title'),
      description: t('landing.features.instantAlerts.description')
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: t('landing.features.healthAnalytics.title'),
      description: t('landing.features.healthAnalytics.description')
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: t('landing.features.communityInsights.title'),
      description: t('landing.features.communityInsights.description')
    },
    {
      icon: <Award className="w-6 h-6" />,
      title: t('landing.features.insuranceReady.title'),
      description: t('landing.features.insuranceReady.description')
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
              <a
                href="https://mr-vision.ch"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'inherit', textDecoration: 'none' }}
              >
                {t('common.createdBy')}
              </a>
              <Star className="w-4 h-4" />
            </div>

            <h1 className="hero-title">
              <span className="fox-emoji">🦊</span>
              <span className="gradient-text">{t('common.appName')}</span>
            </h1>

            <p className="hero-tagline">{t('common.tagline')}</p>

            <h2 className="hero-subtitle">
              {t('landing.hero.title')}
            </h2>

            <p className="hero-description">
              {t('landing.hero.description')}
            </p>
            
            <div className="hero-actions">
              <Link to="/signup" className="btn btn-primary btn-large">
                {t('landing.hero.startMonitoring')}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link to="/login" className="btn btn-secondary btn-large">
                {t('auth.login.submit')}
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
            <h2 className="section-title">{t('landing.features.title')}</h2>
            <p className="section-subtitle">
              {t('landing.features.subtitle')}
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
            <h2 className="section-title">{t('landing.howItWorks.title')}</h2>
            <p className="section-subtitle">{t('landing.howItWorks.subtitle')}</p>
          </motion.div>
          
          <div className="steps">
            <motion.div 
              className="step"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="step-number">1</div>
              <h3>{t('landing.howItWorks.step1.title')}</h3>
              <p>{t('landing.howItWorks.step1.description')}</p>
            </motion.div>

            <motion.div
              className="step"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <div className="step-number">2</div>
              <h3>{t('landing.howItWorks.step2.title')}</h3>
              <p>{t('landing.howItWorks.step2.description')}</p>
            </motion.div>

            <motion.div
              className="step"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <div className="step-number">3</div>
              <h3>{t('landing.howItWorks.step3.title')}</h3>
              <p>{t('landing.howItWorks.step3.description')}</p>
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
            <h2 className="section-title">{t('landing.testimonials.title')}</h2>
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
            <h2 className="section-title">{t('landing.pricing.title')}</h2>
            <p className="section-subtitle">{t('landing.pricing.subtitle')}</p>
          </motion.div>
          
          <div className="pricing-grid">
            <motion.div 
              className="pricing-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h3 className="pricing-title">{t('landing.pricing.free.title')}</h3>
              <div className="pricing-price">
                <span className="currency">CHF</span>
                <span className="amount">{t('landing.pricing.free.price')}</span>
                <span className="period">{t('landing.pricing.free.period')}</span>
              </div>
              <ul className="pricing-features">
                <li><Check className="w-4 h-4" /> {t('landing.pricing.free.features.devices')}</li>
                <li><Check className="w-4 h-4" /> {t('landing.pricing.free.features.monitoring')}</li>
                <li><Check className="w-4 h-4" /> {t('landing.pricing.free.features.alerts')}</li>
                <li><Check className="w-4 h-4" /> {t('landing.pricing.free.features.history')}</li>
              </ul>
              <Link to="/signup" className="btn btn-primary btn-block">
                {t('landing.pricing.free.cta')}
              </Link>
            </motion.div>

            <motion.div
              className="pricing-card pricing-featured"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <div className="pricing-badge">{t('landing.pricing.pro.badge')}</div>
              <h3 className="pricing-title">{t('landing.pricing.pro.title')}</h3>
              <div className="pricing-price">
                <span className="currency">CHF</span>
                <span className="amount">{t('landing.pricing.pro.price')}</span>
                <span className="period">{t('landing.pricing.pro.period')}</span>
              </div>
              <ul className="pricing-features">
                <li><Check className="w-4 h-4" /> {t('landing.pricing.pro.features.devices')}</li>
                <li><Check className="w-4 h-4" /> {t('landing.pricing.pro.features.ai')}</li>
                <li><Check className="w-4 h-4" /> {t('landing.pricing.pro.features.push')}</li>
                <li><Check className="w-4 h-4" /> {t('landing.pricing.pro.features.history')}</li>
                <li><Check className="w-4 h-4" /> {t('landing.pricing.pro.features.reports')}</li>
                <li><Check className="w-4 h-4" /> {t('landing.pricing.pro.features.support')}</li>
              </ul>
              <Link to="/signup" className="btn btn-primary btn-block">
                {t('landing.pricing.pro.cta')}
              </Link>
            </motion.div>

            <motion.div
              className="pricing-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="pricing-title">{t('landing.pricing.business.title')}</h3>
              <div className="pricing-price">
                <span className="currency">CHF</span>
                <span className="amount">{t('landing.pricing.business.price')}</span>
                <span className="period">{t('landing.pricing.business.period')}</span>
              </div>
              <ul className="pricing-features">
                <li><Check className="w-4 h-4" /> {t('landing.pricing.business.features.everything')}</li>
                <li><Check className="w-4 h-4" /> {t('landing.pricing.business.features.team')}</li>
                <li><Check className="w-4 h-4" /> {t('landing.pricing.business.features.api')}</li>
                <li><Check className="w-4 h-4" /> {t('landing.pricing.business.features.integrations')}</li>
                <li><Check className="w-4 h-4" /> {t('landing.pricing.business.features.sla')}</li>
                <li><Check className="w-4 h-4" /> {t('landing.pricing.business.features.dedicated')}</li>
              </ul>
              <a href="mailto:info@mr-vision.ch" className="btn btn-primary btn-block">
                {t('landing.pricing.business.cta')}
              </a>
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
            <h2 className="cta-title">{t('landing.cta.title')}</h2>
            <p className="cta-subtitle">
              {t('landing.cta.subtitle')}
            </p>
            <Link to="/signup" className="btn btn-white btn-large">
              {t('landing.cta.button')}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <p className="cta-note">
              {t('landing.cta.note')}
            </p>

            {/* Mr. Vision Credit */}
            <div className="creator-credit">
              <p className="credit-text">
                {t('landing.cta.credit')}{' '}
                <a
                  href="https://mr-vision.ch"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="credit-name"
                  style={{ color: 'inherit', textDecoration: 'none' }}
                >
                  Mr. Vision
                </a>
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Landing;