import Calculator from './components/Calculator.jsx';
import { toDisplayProps } from './calculatorLogic.js';
import { useCalculator } from './useCalculator.js';

export default function App() {
  const { state, handleKey } = useCalculator();

  return (
    <main className="page">
      <Calculator display={toDisplayProps(state)} onKey={handleKey} />
    </main>
  );
}
