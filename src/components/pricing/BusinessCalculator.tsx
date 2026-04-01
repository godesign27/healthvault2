import { useState } from 'react';
import { track } from '../../lib/analytics';

interface BusinessCalculatorProps {
  darkMode?: boolean;
}

export function BusinessCalculator({ darkMode = false }: BusinessCalculatorProps) {
  const [patients, setPatients] = useState(5000);

  const rate = patients <= 20000 ? 1 : 0.5;
  const monthly = patients * rate;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(0, Number(e.target.value));
    const newRate = val <= 20000 ? 1 : 0.5;
    setPatients(val);
    track('pricing_calc_update', { patients: val, rate: newRate, monthly: val * newRate });
  };

  const isEnterprise = patients > 20000;

  return (
    <div className={`max-w-md mx-auto mt-10 p-6 rounded-2xl shadow-sm border ${
      darkMode
        ? 'bg-stone-800 border-stone-700'
        : 'bg-white border-stone-200'
    }`}>
      <h3 className={`text-xl font-semibold mb-4 text-center ${
        darkMode ? 'text-white' : 'text-stone-900'
      }`}>
        Estimate your monthly cost
      </h3>

      <label
        htmlFor="patients"
        className={`block text-sm font-medium mb-1 ${
          darkMode ? 'text-stone-300' : 'text-stone-700'
        }`}
      >
        Active patients
      </label>

      <input
        id="patients"
        type="number"
        inputMode="numeric"
        min={0}
        value={patients}
        onChange={handleChange}
        className={`w-full mb-4 px-3 py-2 rounded-lg border text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
          darkMode
            ? 'bg-stone-900 border-stone-700 text-white'
            : 'bg-white border-stone-300 text-stone-900'
        }`}
      />

      <div className="text-center mb-4">
        <p className={`${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
          Rate applied: <span className="font-semibold">${rate.toFixed(2)} / patient / month</span>
        </p>
        <p className={`text-3xl font-bold mt-1 ${
          darkMode ? 'text-white' : 'text-stone-900'
        }`}>
          ${monthly.toLocaleString()}
        </p>
        <p className={`text-sm mt-1 ${
          darkMode ? 'text-stone-500' : 'text-stone-500'
        }`}>
          {patients <= 20000
            ? 'Standard rate applies up to 20,000 active patients.'
            : 'Enterprise volume applies to all patients once you exceed 20,000.'}
        </p>
      </div>

      {!isEnterprise ? (
        <button
          onClick={() => track('pricing_calc_start_trial', { patients, monthly })}
          className={`w-full rounded-lg px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
            darkMode ? 'bg-indigo-500 hover:bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-500'
          }`}
        >
          Start Clinic Trial
        </button>
      ) : (
        <button
          onClick={() => track('pricing_calc_enterprise_cta', { patients, monthly })}
          className={`w-full rounded-lg px-4 py-3 text-sm font-semibold shadow-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
            darkMode
              ? 'bg-indigo-500/80 text-white hover:bg-indigo-500 focus-visible:outline-indigo-600'
              : 'bg-white text-indigo-600 border border-indigo-300 hover:bg-indigo-50 focus-visible:outline-indigo-600'
          }`}
        >
          Request Enterprise Demo
        </button>
      )}

      <p className={`mt-3 text-xs text-center ${
        darkMode ? 'text-stone-500' : 'text-stone-500'
      }`}>
        Full platform included at every size—no feature gating.
      </p>
    </div>
  );
}
