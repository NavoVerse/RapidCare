import React from 'react';
import { motion } from 'framer-motion';

const KitSection = ({ kits }) => (
  <div className="section-wrap">
    <div className="sec-hd">
      <div className="sec-title">EMERGENCY KITS</div>
      <div className="sec-link">View all →</div>
    </div>
    <div className="kit-grid">
      {kits.map((kit, index) => (
        <motion.div 
          key={kit.id}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          viewport={{ once: true }}
          className="kit-card"
        >
          <div className="kit-img">
            <img src={kit.img} alt={kit.name} />
            <div className="kit-img-overlay"></div>
            <div className="kit-img-label">{kit.category.toUpperCase()}</div>
          </div>
          <div className="kit-body">
            <div className="kit-tag">{kit.category}</div>
            <div className="kit-name">{kit.name}</div>
            <div className="kit-sub">{kit.desc}</div>
            <div className="kit-items">
              {kit.items.map(item => <span key={item} className="kit-item-tag">{item}</span>)}
            </div>
            <div className="kit-foot">
              <div className="kit-price">₹{kit.price}</div>
              <button className="kit-add">Add to cart</button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  </div>
);

export default KitSection;
