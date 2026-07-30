// Full product database — every single image in /images is mapped to a product
const _products = [
  // ── Pain Relief ──
  { id:'crocin', name:'Crocin 500', molecule:'Paracetamol', category:'Pain Relief', rx:false, img:'images/crocin.png', price:29, mrp:35, pack:'Strip of 15 tabs' },
  { id:'calpol', name:'Calpol 500', molecule:'Paracetamol', category:'Pain Relief', rx:false, img:'images/calpol.jpg', price:32, mrp:38, pack:'Strip of 15 tabs' },
  { id:'dolo-650', name:'Dolo 650', molecule:'Paracetamol', category:'Pain Relief', rx:false, img:'images/dolo-650.png', price:45, mrp:54, pack:'Strip of 15 tabs' },
  { id:'metacin', name:'Metacin 500', molecule:'Paracetamol', category:'Pain Relief', rx:false, img:'images/metacin.jpg', price:26, mrp:32, pack:'Strip of 10 tabs' },
  { id:'pacimol', name:'Pacimol 500', molecule:'Paracetamol', category:'Pain Relief', rx:false, img:'images/pacimol.png', price:30, mrp:36, pack:'Strip of 15 tabs' },
  { id:'brufen', name:'Brufen 400', molecule:'Ibuprofen', category:'Pain Relief', rx:false, img:'images/brufen.png', price:52, mrp:62, pack:'Strip of 15 tabs' },
  { id:'voveran', name:'Voveran 50', molecule:'Diclofenac', category:'Pain Relief', rx:true, img:'images/voveran.jpg', price:37, mrp:45, pack:'Strip of 10 tabs' },
  { id:'zerodol', name:'Zerodol 100', molecule:'Aceclofenac', category:'Pain Relief', rx:true, img:'images/zerodol.jpg', price:68, mrp:82, pack:'Strip of 10 tabs' },
  { id:'hifenac', name:'Hifenac 100', molecule:'Aceclofenac', category:'Pain Relief', rx:true, img:'images/hifenac.jpg', price:72, mrp:87, pack:'Strip of 10 tabs' },
  { id:'nucoxia', name:'Nucoxia 90', molecule:'Etoricoxib', category:'Pain Relief', rx:true, img:'images/nucoxia.jpg', price:89, mrp:108, pack:'Strip of 10 tabs' },

  // ── Antibiotics ──
  { id:'mox', name:'Mox 250', molecule:'Amoxicillin', category:'Antibiotics', rx:true, img:'images/mox.jpg', price:48, mrp:58, pack:'Strip of 10 caps' },
  { id:'novamox', name:'Novamox 250', molecule:'Amoxicillin', category:'Antibiotics', rx:true, img:'images/novamox.jpg', price:51, mrp:62, pack:'Strip of 10 caps' },
  { id:'augmentin', name:'Augmentin 625', molecule:'Amoxicillin + Clavulanate', category:'Antibiotics', rx:true, img:'images/augmentin.png', price:175, mrp:210, pack:'Strip of 10 tabs' },
  { id:'moxclav', name:'Moxclav 625', molecule:'Amoxicillin + Clavulanate', category:'Antibiotics', rx:true, img:'images/moxclav.jpg', price:158, mrp:190, pack:'Strip of 10 tabs' },
  { id:'azee', name:'Azee 500', molecule:'Azithromycin', category:'Antibiotics', rx:true, img:'images/azee.jpg', price:95, mrp:115, pack:'Strip of 3 tabs' },
  { id:'zithrocin', name:'Zithrocin 500', molecule:'Azithromycin', category:'Antibiotics', rx:true, img:'images/zithrocin.jpg', price:88, mrp:106, pack:'Strip of 3 tabs' },
  { id:'taxim-o', name:'Taxim-O 200', molecule:'Cefixime', category:'Antibiotics', rx:true, img:'images/taxim-o.jpg', price:118, mrp:142, pack:'Strip of 10 tabs' },
  { id:'zifi', name:'Zifi 200', molecule:'Cefixime', category:'Antibiotics', rx:true, img:'images/zifi.png', price:108, mrp:130, pack:'Strip of 10 tabs' },
  { id:'ceftum', name:'Ceftum 500', molecule:'Cefuroxime', category:'Antibiotics', rx:true, img:'images/ceftum.jpg', price:245, mrp:295, pack:'Strip of 10 tabs' },
  { id:'oflomac', name:'Oflomac 200', molecule:'Ofloxacin', category:'Antibiotics', rx:true, img:'images/oflomac.jpg', price:62, mrp:75, pack:'Strip of 10 tabs' },
  { id:'zanocin', name:'Zanocin 200', molecule:'Ofloxacin', category:'Antibiotics', rx:true, img:'images/zanocin.jpg', price:67, mrp:81, pack:'Strip of 10 tabs' },
  { id:'ciplox', name:'Ciplox 500', molecule:'Ciprofloxacin', category:'Antibiotics', rx:true, img:'images/ciplox.jpg', price:55, mrp:66, pack:'Strip of 10 tabs' },
  { id:'cifran', name:'Cifran 500', molecule:'Ciprofloxacin', category:'Antibiotics', rx:true, img:'images/cifran.jpg', price:58, mrp:70, pack:'Strip of 10 tabs' },
  { id:'levoflox', name:'Levoflox 500', molecule:'Levofloxacin', category:'Antibiotics', rx:true, img:'images/levoflox.jpg', price:92, mrp:110, pack:'Strip of 10 tabs' },

  // ── Diabetes ──
  { id:'glycomet', name:'Glycomet 500', molecule:'Metformin', category:'Diabetes', rx:true, img:'images/glycomet.png', price:38, mrp:46, pack:'Strip of 10 tabs' },
  { id:'obimet', name:'Obimet 500', molecule:'Metformin', category:'Diabetes', rx:true, img:'images/obimet.jpg', price:35, mrp:42, pack:'Strip of 10 tabs' },
  { id:'amaryl', name:'Amaryl 1', molecule:'Glimepiride', category:'Diabetes', rx:true, img:'images/amaryl.jpg', price:62, mrp:75, pack:'Strip of 10 tabs' },
  { id:'januvia', name:'Januvia 100', molecule:'Sitagliptin', category:'Diabetes', rx:true, img:'images/januvia.jpg', price:245, mrp:295, pack:'Strip of 15 tabs' },
  { id:'galvus', name:'Galvus 50', molecule:'Vildagliptin', category:'Diabetes', rx:true, img:'images/galvus.jpg', price:130, mrp:157, pack:'Strip of 10 tabs' },
  { id:'actrapid', name:'Actrapid 40IU', molecule:'Insulin', category:'Diabetes', rx:true, img:'images/actrapid.jpg', price:520, mrp:625, pack:'1 vial / 10ml' },
  { id:'mixtard', name:'Mixtard 30/70', molecule:'Insulin', category:'Diabetes', rx:true, img:'images/mixtard.jpg', price:540, mrp:648, pack:'1 vial / 10ml' },

  // ── Cardiac Care ──
  { id:'amlong', name:'Amlong 5', molecule:'Amlodipine', category:'Cardiac Care', rx:true, img:'images/amlong.jpg', price:22, mrp:27, pack:'Strip of 10 tabs' },
  { id:'stamlo', name:'Stamlo 5', molecule:'Amlodipine', category:'Cardiac Care', rx:true, img:'images/stamlo.jpg', price:25, mrp:30, pack:'Strip of 10 tabs' },
  { id:'telma', name:'Telma 40', molecule:'Telmisartan', category:'Cardiac Care', rx:true, img:'images/telma.png', price:48, mrp:58, pack:'Strip of 10 tabs' },
  { id:'losar', name:'Losar 50', molecule:'Losartan', category:'Cardiac Care', rx:true, img:'images/losar.jpg', price:35, mrp:42, pack:'Strip of 10 tabs' },
  { id:'aten', name:'Aten 50', molecule:'Atenolol', category:'Cardiac Care', rx:true, img:'images/aten.jpg', price:28, mrp:34, pack:'Strip of 10 tabs' },
  { id:'metolar', name:'Metolar 25', molecule:'Metoprolol', category:'Cardiac Care', rx:true, img:'images/metolar.jpg', price:32, mrp:39, pack:'Strip of 10 tabs' },
  { id:'cardace', name:'Cardace 5', molecule:'Ramipril', category:'Cardiac Care', rx:true, img:'images/cardace.jpg', price:42, mrp:51, pack:'Strip of 10 tabs' },

  // ── Digestion ──
  { id:'pantocid', name:'Pantocid 40', molecule:'Pantoprazole', category:'Digestion', rx:false, img:'images/pantocid.jpg', price:42, mrp:51, pack:'Strip of 10 tabs' },
  { id:'pan', name:'Pan 40', molecule:'Pantoprazole', category:'Digestion', rx:false, img:'images/pan.jpg', price:38, mrp:46, pack:'Strip of 10 tabs' },
  { id:'omez', name:'Omez 20', molecule:'Omeprazole', category:'Digestion', rx:false, img:'images/omez.jpg', price:24, mrp:29, pack:'Strip of 10 caps' },
  { id:'rablet', name:'Rablet 20', molecule:'Rabeprazole', category:'Digestion', rx:false, img:'images/rablet.jpg', price:58, mrp:70, pack:'Strip of 10 tabs' },
  { id:'nexpro', name:'Nexpro 40', molecule:'Esomeprazole', category:'Digestion', rx:false, img:'images/nexpro.jpg', price:85, mrp:102, pack:'Strip of 10 tabs' },
  { id:'aciloc', name:'Aciloc 150', molecule:'Ranitidine', category:'Digestion', rx:false, img:'images/aciloc.jpg', price:18, mrp:22, pack:'Strip of 10 tabs' },

  // ── Allergy ──
  { id:'cetzine', name:'Cetzine 10', molecule:'Cetirizine', category:'Allergy', rx:false, img:'images/cetzine.jpg', price:22, mrp:27, pack:'Strip of 10 tabs' },
  { id:'xyzal', name:'Xyzal 5', molecule:'Levocetirizine', category:'Allergy', rx:false, img:'images/xyzal.jpg', price:52, mrp:63, pack:'Strip of 10 tabs' },
  { id:'allegra', name:'Allegra 120', molecule:'Fexofenadine', category:'Allergy', rx:false, img:'images/allegra.jpg', price:68, mrp:82, pack:'Strip of 10 tabs' },
  { id:'avil', name:'Avil 25', molecule:'Chlorpheniramine', category:'Allergy', rx:false, img:'images/avil.jpg', price:15, mrp:18, pack:'Strip of 10 tabs' },

  // ── Respiratory ──
  { id:'mucolite', name:'Mucolite 30', molecule:'Ambroxol', category:'Respiratory', rx:false, img:'images/mucolite.jpg', price:28, mrp:34, pack:'Strip of 10 tabs' },
  { id:'benadryl-dr', name:'Benadryl DR', molecule:'Dextromethorphan', category:'Respiratory', rx:false, img:'images/benadryl-dr.jpg', price:58, mrp:70, pack:'Bottle 100ml' },
  { id:'montair', name:'Montair 10', molecule:'Montelukast', category:'Respiratory', rx:true, img:'images/montair.png', price:75, mrp:90, pack:'Strip of 10 tabs' },
  { id:'asthalin', name:'Asthalin 100', molecule:'Salbutamol', category:'Respiratory', rx:true, img:'images/inhaler.png', price:95, mrp:114, pack:'1 Inhaler / 200 doses' },

  // ── Supplements ──
  { id:'becosules', name:'Becosules', molecule:'Vitamin B Complex', category:'Supplements', rx:false, img:'images/becosules.jpg', price:55, mrp:66, pack:'Strip of 10 caps' },
  { id:'shelcal', name:'Shelcal 500', molecule:'Calcium', category:'Supplements', rx:false, img:'images/shelcal.jpg', price:78, mrp:94, pack:'Strip of 15 tabs' },
  { id:'revital', name:'Revital H', molecule:'Multivitamin', category:'Supplements', rx:false, img:'images/revital.jpg', price:98, mrp:118, pack:'Bottle 30 caps' },
  { id:'electral', name:'Electral', molecule:'ORS', category:'Supplements', rx:false, img:'images/electral.png', price:25, mrp:30, pack:'Box of 5 sachets' },
  { id:'dexorange', name:'Dexorange Syrup', molecule:'Iron + B12', category:'Supplements', rx:false, img:'images/syrup.png', price:85, mrp:102, pack:'Bottle 200ml' },
  { id:'uprise-d3', name:'Uprise D3 60K', molecule:'Vitamin D3', category:'Supplements', rx:false, img:'images/tablets.png', price:48, mrp:58, pack:'Strip of 4 caps' },

  // ── Dermatology / Skin ──
  { id:'forcan', name:'Forcan 150', molecule:'Fluconazole', category:'Dermatology', rx:true, img:'images/cream.png', price:52, mrp:63, pack:'Strip of 1 cap' },
  { id:'canditral', name:'Canditral 100', molecule:'Itraconazole', category:'Dermatology', rx:true, img:'images/med_13.jpg', price:105, mrp:126, pack:'Strip of 4 caps' },
  { id:'candid', name:'Candid Cream', molecule:'Clotrimazole', category:'Dermatology', rx:false, img:'images/cream.png', price:45, mrp:54, pack:'1 Tube 15g' },
  { id:'betnovate', name:'Betnovate C', molecule:'Betamethasone', category:'Dermatology', rx:true, img:'images/cream.png', price:38, mrp:46, pack:'1 Tube 15g' },
  { id:'momate', name:'Momate', molecule:'Mometasone', category:'Dermatology', rx:true, img:'images/cream.png', price:42, mrp:51, pack:'1 Tube 15g' },
  { id:'tenovate', name:'Tenovate', molecule:'Clobetasol', category:'Dermatology', rx:true, img:'images/cream.png', price:35, mrp:42, pack:'1 Tube 15g' },

  // ── Neurological ──
  { id:'pregaba', name:'Pregaba 75', molecule:'Pregabalin', category:'Neurological', rx:true, img:'images/med_1.jpg', price:88, mrp:106, pack:'Strip of 10 caps' },
  { id:'maxgalin', name:'Maxgalin 75', molecule:'Pregabalin', category:'Neurological', rx:true, img:'images/med_2.jpg', price:92, mrp:110, pack:'Strip of 10 caps' },
  { id:'gabapin', name:'Gabapin 300', molecule:'Gabapentin', category:'Neurological', rx:true, img:'images/med_3.jpg', price:65, mrp:78, pack:'Strip of 10 caps' },
  { id:'tryptomer', name:'Tryptomer 25', molecule:'Amitriptyline', category:'Neurological', rx:true, img:'images/med_4.jpg', price:28, mrp:34, pack:'Strip of 10 tabs' },
  { id:'alprax', name:'Alprax 0.5', molecule:'Alprazolam', category:'Neurological', rx:true, img:'images/med_5.jpg', price:35, mrp:42, pack:'Strip of 10 tabs' },
  { id:'clonotril', name:'Clonotril 0.5', molecule:'Clonazepam', category:'Neurological', rx:true, img:'images/med_6.jpg', price:42, mrp:51, pack:'Strip of 10 tabs' },
  { id:'sertima', name:'Sertima 50', molecule:'Sertraline', category:'Neurological', rx:true, img:'images/med_7.jpg', price:55, mrp:66, pack:'Strip of 10 tabs' },

  // ── Thyroid / Hormones ──
  { id:'thyronorm', name:'Thyronorm 50', molecule:'Thyroxine', category:'Thyroid', rx:true, img:'images/med_8.jpg', price:22, mrp:27, pack:'Strip of 10 tabs' },
  { id:'wysolone', name:'Wysolone 10', molecule:'Prednisolone', category:'Thyroid', rx:true, img:'images/med_9.jpg', price:18, mrp:22, pack:'Strip of 10 tabs' },

  // ── General / Miscellaneous ──
  { id:'zentel', name:'Zentel 400', molecule:'Albendazole', category:'General', rx:true, img:'images/med_10.jpg', price:15, mrp:18, pack:'Strip of 1 tab' },
  { id:'ivecop', name:'Ivecop 12', molecule:'Ivermectin', category:'General', rx:true, img:'images/med_11.jpg', price:28, mrp:34, pack:'Strip of 4 tabs' },

  // ── Extra products using remaining med_ images ──
  { id:'med-14', name:'Sporidex 500', molecule:'Cephalexin', category:'Antibiotics', rx:true, img:'images/med_14.jpg', price:72, mrp:86, pack:'Strip of 10 caps' },
  { id:'med-15', name:'Rifagut 200', molecule:'Rifaximin', category:'Digestion', rx:true, img:'images/med_15.jpg', price:145, mrp:174, pack:'Strip of 10 tabs' },
  { id:'med-16', name:'Pyzina H', molecule:'Isoniazid + Rifampicin', category:'General', rx:true, img:'images/med_16.jpg', price:58, mrp:70, pack:'Strip of 10 tabs' },
  { id:'med-17', name:'Ascoril Syrup', molecule:'Terbutaline + Bromhexine', category:'Respiratory', rx:false, img:'images/med_17.jpg', price:65, mrp:78, pack:'Bottle 100ml' },
  { id:'med-18', name:'Budesonide 200', molecule:'Budesonide', category:'Respiratory', rx:true, img:'images/med_18.jpg', price:72, mrp:86, pack:'1 Inhaler / 200 doses' },
  { id:'med-19', name:'Azidrop Eye Drops', molecule:'Azithromycin Topical', category:'General', rx:true, img:'images/med_19.jpg', price:45, mrp:54, pack:'5ml bottle' },
  { id:'med-0', name:'Clindamycin 300', molecule:'Clindamycin', category:'Antibiotics', rx:true, img:'images/med_0.jpg', price:68, mrp:82, pack:'Strip of 10 caps' },
  { id:'med-12', name:'Mefkind 400', molecule:'Mefenamic Acid', category:'Pain Relief', rx:false, img:'images/med_12.jpg', price:32, mrp:38, pack:'Strip of 10 tabs' },
];

export default _products;
export { _products as allProducts };
