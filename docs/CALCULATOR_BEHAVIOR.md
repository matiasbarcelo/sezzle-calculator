# Casio SL-200TE — Behavior Reference

Reference for replicating the physical Casio SL-200TE (silver, "Dual Leaf", Tax & Exchange) in the React app.

Status tags:
- **[Confirmed]** — observed on the owner's physical unit.
- **[Manual]** — from the Casio user manual, not yet tested on the unit.
- **[Unverified]** — inferred from similar Casio models; test before implementing.

---

## 1. Display

8-digit, seven-segment LCD.

### Digits
- Each digit has a decimal point at its bottom right.
- **Commas sit on top of the digits** (atypical), after digit indexes **0, 1, 2, 3, 4** (index 0 = left-most). **[Confirmed]**
- Commas do **not** show when the display reads zero. **[Confirmed]**
- Commas only light for digits in use (app behavior; verify against short numbers on the unit). **[Unverified]**

### Indicators
Left column (left of the digits):
- **E** only — sits level with the middle of the digits. **[Confirmed]**

Top row, left to right. The row starts in the E column (**TAX+ sits directly above E**) and the labels spread evenly up to the operator box over the right-most digit. **[Confirmed]**

| Indicator | Meaning | Status |
|---|---|---|
| `TAX+` | Result includes tax | [Confirmed position] |
| `TAX−` | Result is the pre-tax price. The **"TAX" half lights alone** (with `%`) when showing the stored tax rate. | [Confirmed] |
| `C1` `C2` `C3` | Currency / exchange-rate slot in use | [Confirmed position] |
| `SET` | Rate-setting mode (after holding `%`); left of EXCH | [Confirmed position] |
| `EXCH` | Currency-conversion mode is on | [Confirmed] |
| `%` | Showing a rate | [Confirmed] |
| Operator boxes | **Four separate** dark boxes with a light symbol, one per operation, left to right: **÷** (starts a little left of the second-to-right-most digit), **×**, **+** (at the start of the right-most digit), **−** (ends at the right edge of the right-most digit). The box for the pending operation lights. | [Confirmed] |

There is no `M` memory indicator in the left column. Whether memory shows anywhere is still unknown. **[Unverified]**

### Error / edge cases
- Divide by zero (and other errors): small **E** at the far left, a single **0** in the right-most digit (index 7), no commas. **[Confirmed]**
- Overflow beyond 99,999,999 presumably also shows E. **[Unverified]**
- Clear with `C` or `AC`. **[Unverified]**

### Operator boxes
- Four boxes: ÷ × + −. Pressing an operation key lights its box. **[Confirmed]**
- Pressing `−` before entering digits lights the − box. **[Confirmed]**
- How a negative *result* is marked is unknown. **[Unverified]**

---

## 2. Keypad (7 columns × 4 rows)

| | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|
| **1** | M/EX | 7 | 8 | 9 | % (SET) | TAX− | TAX+ (TAX RATE) |
| **2** | +/− | 4 | 5 | 6 | × | ÷ | MRC (EX RATE) · C3 |
| **3** | C | 1 | 2 | 3 | + (tall, rows 3–4) | − | M− (EX RATE) · C2 |
| **4** | AC (ON) | 0 (wide) | | • | + | = | M+ · C1 |

- `SET`, `TAX RATE`, `EX RATE` are **printed on the case** above the keys.
- `M/EX` toggles MRC / M− / M+ between memory and currency (C3 / C2 / C1). **[Manual]**

---

## 3. Tax functions

### Setting the tax rate **[Manual — confirm on unit]**
1. `AC`
2. **Press and hold `%`** until **SET** appears (~2 s). A quick press does nothing.
3. `TAX+`
4. Type the rate (e.g. `21`, `10.5`, `5.75`)
5. `%` to save

### Recalling the rate **[Confirmed]**
`AC` → `TAX+` shows the rate with "TAX" (of TAX−) and `%` lit. Default observed: **5**.

### Math **[Confirmed]**
With rate `r`:

| Key | Formula | Example (r = 5%, input 100) |
|---|---|---|
| `TAX+` | `x × (1 + r)` — add tax to a pre-tax price | **105** |
| `TAX−` | `x ÷ (1 + r)` — remove tax from a tax-inclusive price | **95.2381** |

- TAX− is **not** `x − r%`. It answers "what price, with tax added, equals x?"
- The unit showed `95.2381`, not `95.238095`, so tax results appear **rounded to 4 decimals**. **[Unverified — test `7` TAX− → expect `6.6667`]**
- Pressing the tax key again likely shows the **tax amount** (e.g. `100` TAX− TAX− → `4.7619`). **[Unverified]**

---

## 4. Currency exchange **[Manual]**

- **C1 is fixed at 1** (home currency). Only **C2** and **C3** can be set.
- Set: `AC` → hold `%` until SET → `M−` (C2) or `MRC` (C3) → type rate → `%`.
- Recall: `AC` → currency key.
- `M/EX` switches into conversion mode; `EXCH` lights.
- Rate limits: rates ≥ 1 up to 6 digits; rates < 1 up to 8 digits including leading zeros, 6 significant digits recognized.

---

## 5. Application: Argentina

### IVA (Impuesto al Valor Agregado)
Shelf prices in Argentina **already include IVA**, so **TAX−** is the key that recovers the pre-tax price.

| Rate | Applies to (general) |
|---|---|
| **21%** | General rate — most goods and services |
| **10.5%** | Reduced — some foods, medicine, some construction |
| **27%** | Some utilities for businesses (electricity, gas, telecom) |

Example at 21%:
- `1210` → `TAX−` → **1000** (net price)
- `TAX−` again → **210** (IVA amount) **[Unverified second press]**
- `1000` → `TAX+` → **1210**

Key point: at 21%, IVA is **≈17.36% of the shelf price**, not 21%, because the rate applies to the pre-tax base.

Uses:
- Checking the "IVA contenido" line on receipts required by the consumer tax-transparency law (**Ley 27.743**).
- Splitting totals into net + IVA for expense reports or small-business bookkeeping.
- Comparing prices quoted with vs. without IVA (e.g. B2B quotes "+ IVA").

### Formal vs. informal economy
- **Formal** (supermarkets, chains, utilities, card/transfer payments, online): IVA is recorded with ARCA (ex-AFIP) and paid — TAX− applies.
- **Informal** (cash, small shops, trades, "sin factura"): IVA often isn't charged; prices may already be "net", so TAX− would understate the real price. Know which kind of price you're looking at.

### Pesos and dollars
- Everyday prices, wages and bills: **pesos**.
- Savings, real estate, used cars, some services: **USD**.
- Multiple exchange rates exist historically (official, MEP, "blue"). Currency controls for individuals were largely lifted in 2025 and the gap narrowed, but conditions change — use current rates.
- Suggested use of slots: **C1** = pesos (home, fixed at 1), **C2** = your working USD rate, **C3** = an alternate rate (e.g. official vs. blue/MEP) for comparison.

### Limits to watch
- **8-digit display (max 99,999,999).** Peso amounts get large; anything bigger triggers E. Work in thousands for large figures.
- Exchange rates ≥ 1 allow up to 6 digits (ARS per USD fits).

---

## Sources
- [Casio SL-200TE user manual (manua.ls)](https://www.manua.ls/casio/sl-200te/manual)
- [HelpOwl: changing the tax rate on the SL-200TE](https://www.helpowl.com/q/Casio/SL200TE/Technical-Support/change-tax-rate-sl-200te-calculator-8/1079857)
