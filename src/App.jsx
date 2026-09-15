import { useState } from 'react';
import Calculator from './components/Calculator.jsx';

// Front end only for now: the calculation logic will plug into handleKey.
// The preview buttons exist to check the display states visually.
const PREVIEWS = {
  Reset: { text: '0.' },
  'Photo (12345678)': { text: '1234567.8', currency: 'C1', exchange: true },
  'Minus (−)': { text: '0.', operator: '−' },
  'Plus (+)': { text: '100.', operator: '+' },
  'Times (×)': { text: '100.', operator: '×' },
  'Divide (÷)': { text: '100.', operator: '÷' },
  'Tax rate (5%)': { text: '5.', tax: true, percent: true },
  'All indicators': { allOn: true },
  Error: { text: '0.', error: true },
};

export default function App() {
  const [display, setDisplay] = useState(PREVIEWS.Reset);

  function handleKey(id) {
    console.log('key', id);
  }

  return (
    <main className="page">
      <Calculator display={display} onKey={handleKey} />
      <div className="previews">
        {Object.entries(PREVIEWS).map(([name, state]) => (
          <button key={name} type="button" onClick={() => setDisplay(state)}>
            {name}
          </button>
        ))}
      </div>
    </main>
  );
}
