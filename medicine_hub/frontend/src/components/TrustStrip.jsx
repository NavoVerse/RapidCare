import React from 'react';
import { ShieldCheck, Truck, Clock, Activity } from 'lucide-react';

const TrustStrip = () => (
  <div className="trust-strip">
    <div className="trust-strip-inner">
      <div className="trust-item"><ShieldCheck size={16} /> CDSCO Approved</div>
      <div className="trust-item"><Truck size={16} /> 2,000+ Partners</div>
      <div className="trust-item"><Clock size={16} /> 30 Min Delivery</div>
      <div className="trust-item"><Activity size={16} /> Live Tracking</div>
      {/* Duplicated for smooth marquee effect */}
      <div className="trust-item"><ShieldCheck size={16} /> CDSCO Approved</div>
      <div className="trust-item"><Truck size={16} /> 2,000+ Partners</div>
    </div>
  </div>
);

export default TrustStrip;
