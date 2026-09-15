import Display from './Display.jsx';
import Keypad from './Keypad.jsx';

// Casio SL-200TE (silver), drawn opened flat: display leaf on top, keypad leaf below.
export default function Calculator({ display, onKey }) {
  return (
    <div className="calculator">
      <div className="leaf lid">
        <div className="lid-panel">
          <div className="lid-top">
            <Display {...display} />
            <div className="brand-row">
              <span className="brand">CASIO</span>
              <span className="tax-exchange">TAX &amp; EXCHANGE</span>
            </div>
          </div>
          <div className="lid-bottom">
            <div className="solar-panel">
              <span>TWO WAY POWER</span>
            </div>
            <span className="model-line">
              <span className="model">SL-200TE</span>
              <span className="dual-leaf">DUAL LEAF</span>
            </span>
          </div>
        </div>
      </div>

      <div className="hinges" aria-hidden="true">
        <span className="hinge" />
        <span className="hinge" />
      </div>

      <div className="leaf base">
        <Keypad onKey={onKey} />
      </div>
    </div>
  );
}
