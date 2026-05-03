import React from 'react';
import { motion } from 'framer-motion';
import { Clock, ShieldCheck, FileText, Phone } from 'lucide-react';

const DeliveryBar = () => {
  const items = [
    { icon: <Clock size={20} />, title: '30-min express delivery', sub: 'Emergency orders, 24/7' },
    { icon: <ShieldCheck size={20} />, title: 'Verified medicines only', sub: 'CDSCO approved' },
    { icon: <FileText size={20} />, title: 'Prescription handled', sub: 'Upload Rx — verified online' },
    { icon: <Phone size={20} />, title: '24/7 pharmacist support', sub: 'Call 1800-RC-CARE' }
  ];

  return (
    <div className="del-bar">
      {items.map((item, index) => (
        <motion.div 
          key={index}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          viewport={{ once: true }}
          className="del-item"
        >
          <div className="del-icon">{item.icon}</div>
          <div>
            <div className="del-title">{item.title}</div>
            <div className="del-sub">{item.sub}</div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default DeliveryBar;
