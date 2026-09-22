export const prescriptions = {
  "anitha-raghavan": [
    {
      date: "Tue, 14 Jul 2026",
      note: "Patient reports mild fever and body ache for two days. No cough or breathing difficulty. Advised paracetamol 500mg thrice daily for three days, plenty of fluids, and rest. Review if fever persists beyond three days.",
    },
    {
      date: "Thu, 12 Mar 2026",
      note: "Routine follow-up for seasonal allergies. Symptoms well controlled on current antihistamine. Continue cetirizine 10mg at night as needed. No further action required unless symptoms return.",
    },
  ],
  "fathima-rasheed": [
    {
      date: "Tue, 12 May 2026",
      note: "Mild acidity and occasional heartburn after meals. Advised smaller, more frequent meals and avoiding late dinners. Prescribed antacid syrup, 10ml after meals, for one week.",
    },
  ],
};

export function getPrescriptions(doctorId) {
  return prescriptions[doctorId] || [];
}
