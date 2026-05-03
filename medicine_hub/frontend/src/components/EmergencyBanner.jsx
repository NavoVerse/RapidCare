import React from 'react';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';

const EmergencyBanner = () => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="emerg"
  >
    <div className="emerg-icon">
      <Activity size={28} color="#F0EDE5" />
    </div>
    <div className="emerg-body">
      <div className="emerg-tag">
        <span className="live-dot"></span>
        EMERGENCY DELIVERY ACTIVE — ALL INDIA
      </div>
      <div className="emerg-title">NEED IT IN 30 MINUTES?</div>
      <div className="emerg-sub">
        Express dispatch from nearest partner pharmacy — 2,000+ cities covered, available 24/7.
      </div>
    </div>
    <div className="emerg-right">
      <div className="emerg-timer">
        <div className="emerg-timer-num">30</div>
        <div className="emerg-timer-label">MIN ETA</div>
      </div>
      <button className="emerg-btn">Order now →</button>
    </div>
  </motion.div>
);

export default EmergencyBanner;
