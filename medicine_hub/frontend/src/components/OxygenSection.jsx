import React from 'react';
import { motion } from 'framer-motion';

const OxygenSection = ({ data }) => {
  if (!data) return null;
  const { main, side } = data;

  return (
    <div className="section-wrap">
      <div className="sec-hd">
        <div className="sec-title">EMERGENCY OXYGEN</div>
        <div className="sec-link">View all →</div>
      </div>
      <div className="oxy-row">
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="oxy-main"
        >
          <div className="oxy-text">
            <div className="oxy-eyebrow">MEDICAL GRADE · ISI CERTIFIED</div>
            <div className="oxy-title">{main.title}</div>
            <div className="oxy-desc">{main.desc}</div>
            <div className="oxy-vars">
              {main.vars.map(v => (
                <div key={v.name} className="oxy-var">
                  <div className="oxy-var-name">{v.name}</div>
                  <div className="oxy-var-price">₹{v.price}</div>
                  <div className="oxy-var-sub">{v.sub}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="oxy-img-block">
            <img src={main.img} alt="Oxygen" />
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="oxy-side"
        >
          <div className="oxy-side-eyebrow">HOME THERAPY</div>
          <div className="oxy-side-title">OXYGEN CONCENTRATOR</div>
          <img src={side.img} alt="Concentrator" className="oxy-side-img" />
          <div className="oxy-side-sub">{side.desc}</div>
          <div className="oxy-side-price">₹{side.price}</div>
          <div className="oxy-side-pack">{side.pack}</div>
          <button className="oxy-side-btn">Add to cart</button>
        </motion.div>
      </div>
    </div>
  );
};

export default OxygenSection;
