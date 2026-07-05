const COMMON_MEDICINES = [
  { name: 'Paracetamol', category: 'pain reliever' },
  { name: 'Ibuprofen', category: 'pain reliever' },
  { name: 'Aspirin', category: 'pain reliever' },
  { name: 'Coartem', category: 'antimalarial' },
  { name: 'Artemether-Lumefantrine', category: 'antimalarial' },
  { name: 'Amoxicillin', category: 'antibiotic' },
  { name: 'Azithromycin', category: 'antibiotic' },
  { name: 'Ciprofloxacin', category: 'antibiotic' },
  { name: 'Metformin', category: 'diabetes' },
  { name: 'Insulin', category: 'diabetes' },
  { name: 'Salbutamol', category: 'asthma' },
  { name: 'ORS', category: 'rehydration' },
  { name: 'Zinc', category: 'supplement' },
  { name: 'Vitamin C', category: 'supplement' },
  { name: 'Antacid', category: 'digestive' },
  { name: 'Loperamide', category: 'digestive' },
  { name: 'Chlorpheniramine', category: 'antihistamine' },
  { name: 'Cetirizine', category: 'antihistamine' },
  { name: 'Hydrocortisone cream', category: 'skin' },
  { name: 'Antiseptic', category: 'wound care' },
];

const MEDICINE_CATEGORIES = [...new Set(COMMON_MEDICINES.map((m) => m.category))];

module.exports = { COMMON_MEDICINES, MEDICINE_CATEGORIES };
