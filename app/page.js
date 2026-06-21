"use client";
import { useState, useEffect } from 'react';

export default function RepyrMVP() {
  const [step, setStep] = useState(1);
  const [vehicle, setVehicle] = useState({ year: '', make: '', model: '' });
  const [makes, setMakes] = useState([]);
  const [models, setModels] = useState([]);
  const [chat, setChat] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    if (vehicle.year) {
      fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/GetMakesForVehicleType/car?format=json`)
        .then(res => res.json())
        .then(data => setMakes(data.Results.slice(0, 50)));
    }
  }, [vehicle.year]);

  useEffect(() => {
    if (vehicle.make) {
      fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMake/${vehicle.make}?format=json`)
        .then(res => res.json())
        .then(data => setModels(data.Results));
    }
  }, [vehicle.make]);

  const startDiagnostic = async () => {
    if (!vehicle.year || !vehicle.make || !vehicle.model) return;
    setLoading(true);
    const res = await fetch('/api/diagnose', {
      method: 'POST',
      body: JSON.stringify({ action: 'init', ...vehicle })
    });
    const data = await res.json();
    setSessionId(data.sessionId);
    setChat([{ role: 'assistant', text: `Hello! I see you are having issues with your ${vehicle.year} ${vehicle.make} ${vehicle.model}. Please describe the symptoms you are experiencing.` }]);
    setStep(2);
    setLoading(false);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', text: input };
    setChat(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const res = await fetch('/api/diagnose', {
      method: 'POST',
      body: JSON.stringify({ action: 'chat', sessionId, message: input, history: chat })
    });
    const data = await res.json();
    setChat(prev => [...prev, { role: 'assistant', text: data.reply }]);
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <header style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#E53E3E', margin: 0 }}>Repyr</h1>
        <p style={{ color: '#718096', marginTop: '5px' }}>AI Mechanic Diagnostic Hub (UAE MVP)</p>
      </header>

      {step === 1 && (
        <div style={{ background: '#f7fafc', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <h3>Select Your Vehicle</h3>
          <select style={{ width: '100%', padding: '10px', marginBottom: '15px' }} onChange={e => setVehicle({...vehicle, year: e.target.value})}>
            <option value="">Select Year</option>
            {['2026','2025','2024','2023','2022','2021','2020','2019','2018','2017'].map(y => <option key={y} value={y}>{y}</option>)}
          </select>

          <select style={{ width: '100%', padding: '10px', marginBottom: '15px' }} disabled={!vehicle.year} onChange={e => setVehicle({...vehicle, make: e.target.value})}>
            <option value="">Select Make</option>
            {makes.map(m => <option key={m.MakeName} value={m.MakeName}>{m.MakeName}</option>)}
          </select>

          <select style={{ width: '100%', padding: '10px', marginBottom: '20px' }} disabled={!vehicle.make} onChange={e => setVehicle({...vehicle, model: e.target.value})}>
            <option value="">Select Model</option>
            {models.slice(0,30).map(m => <option key={m.Model_Name} value={m.Model_Name}>{m.Model_Name}</option>)}
          </select>

          <button style={{ width: '100%', padding: '12px', background: '#E53E3E', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }} onClick={startDiagnostic} disabled={loading}>
            {loading ? 'Initializing Agent...' : 'Connect to AI Mechanic'}
          </button>
        </div>
      )}

      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '500px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
          <div style={{ flex: 1, padding: '15px', overflowY: 'auto', background: '#edf2f7' }}>
            {chat.map((msg, idx) => (
              <div key={idx} style={{ textAlign: msg.role === 'user' ? 'right' : 'left', margin: '10px 0' }}>
                <span style={{ display: 'inline-block', padding: '10px', borderRadius: '8px', background: msg.role === 'user' ? '#3182ce' : 'white', color: msg.role === 'user' ? 'white' : 'black', maxWidth: '80%' }}>
                  {msg.text}
                </span>
              </div>
            ))}
            {loading && <p style={{ color: '#718096', fontSize: '12px' }}>AI Mechanic is evaluating system faults...</p>}
          </div>
          <div style={{ display: 'flex', padding: '10px', borderTop: '1px solid #e2e8f0' }}>
            <input style={{ flex: 1, padding: '10px', border: '1px solid #cbd5e0', borderRadius: '4px' }} type="text" value={input} placeholder="Describe the symptom (e.g. grinding noise, AC warm)..." onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} />
            <button style={{ padding: '10px 20px', marginLeft: '10px', background: '#E53E3E', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }} onClick={sendMessage}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
}