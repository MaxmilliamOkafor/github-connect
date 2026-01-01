import { useState, useCallback } from "react";
import { CalcButton } from "./CalcButton";
import { CalcDisplay } from "./CalcDisplay";

export const Calculator = () => {
  const [display, setDisplay] = useState("0");
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const inputDigit = useCallback((digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === "0" ? digit : display + digit);
    }
  }, [display, waitingForOperand]);

  const inputDecimal = useCallback(() => {
    if (waitingForOperand) {
      setDisplay("0.");
      setWaitingForOperand(false);
    } else if (!display.includes(".")) {
      setDisplay(display + ".");
    }
  }, [display, waitingForOperand]);

  const clear = useCallback(() => {
    setDisplay("0");
    setPreviousValue(null);
    setOperator(null);
    setWaitingForOperand(false);
  }, []);

  const toggleSign = useCallback(() => {
    setDisplay((parseFloat(display) * -1).toString());
  }, [display]);

  const inputPercent = useCallback(() => {
    setDisplay((parseFloat(display) / 100).toString());
  }, [display]);

  const performOperation = useCallback((nextOperator: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operator) {
      const currentValue = previousValue || 0;
      let result: number;

      switch (operator) {
        case "+":
          result = currentValue + inputValue;
          break;
        case "-":
          result = currentValue - inputValue;
          break;
        case "×":
          result = currentValue * inputValue;
          break;
        case "÷":
          result = inputValue !== 0 ? currentValue / inputValue : 0;
          break;
        default:
          result = inputValue;
      }

      setDisplay(String(result));
      setPreviousValue(result);
    }

    setWaitingForOperand(true);
    setOperator(nextOperator);
  }, [display, operator, previousValue]);

  const calculate = useCallback(() => {
    if (operator && previousValue !== null) {
      const inputValue = parseFloat(display);
      let result: number;

      switch (operator) {
        case "+":
          result = previousValue + inputValue;
          break;
        case "-":
          result = previousValue - inputValue;
          break;
        case "×":
          result = previousValue * inputValue;
          break;
        case "÷":
          result = inputValue !== 0 ? previousValue / inputValue : 0;
          break;
        default:
          result = inputValue;
      }

      setDisplay(String(result));
      setPreviousValue(null);
      setOperator(null);
      setWaitingForOperand(true);
    }
  }, [display, operator, previousValue]);

  return (
    <div className="w-full max-w-sm mx-auto animate-scale-in">
      <div className="bg-card rounded-3xl p-6 shadow-2xl calc-glow">
        <CalcDisplay value={display} />
        
        <div className="grid grid-cols-4 gap-3 mt-6">
          {/* Row 1 */}
          <CalcButton variant="function" onClick={clear}>
            {display === "0" ? "AC" : "C"}
          </CalcButton>
          <CalcButton variant="function" onClick={toggleSign}>
            ±
          </CalcButton>
          <CalcButton variant="function" onClick={inputPercent}>
            %
          </CalcButton>
          <CalcButton 
            variant="operator" 
            onClick={() => performOperation("÷")}
            isActive={operator === "÷"}
          >
            ÷
          </CalcButton>

          {/* Row 2 */}
          <CalcButton onClick={() => inputDigit("7")}>7</CalcButton>
          <CalcButton onClick={() => inputDigit("8")}>8</CalcButton>
          <CalcButton onClick={() => inputDigit("9")}>9</CalcButton>
          <CalcButton 
            variant="operator" 
            onClick={() => performOperation("×")}
            isActive={operator === "×"}
          >
            ×
          </CalcButton>

          {/* Row 3 */}
          <CalcButton onClick={() => inputDigit("4")}>4</CalcButton>
          <CalcButton onClick={() => inputDigit("5")}>5</CalcButton>
          <CalcButton onClick={() => inputDigit("6")}>6</CalcButton>
          <CalcButton 
            variant="operator" 
            onClick={() => performOperation("-")}
            isActive={operator === "-"}
          >
            −
          </CalcButton>

          {/* Row 4 */}
          <CalcButton onClick={() => inputDigit("1")}>1</CalcButton>
          <CalcButton onClick={() => inputDigit("2")}>2</CalcButton>
          <CalcButton onClick={() => inputDigit("3")}>3</CalcButton>
          <CalcButton 
            variant="operator" 
            onClick={() => performOperation("+")}
            isActive={operator === "+"}
          >
            +
          </CalcButton>

          {/* Row 5 */}
          <CalcButton onClick={() => inputDigit("0")} className="col-span-2">
            0
          </CalcButton>
          <CalcButton onClick={inputDecimal}>.</CalcButton>
          <CalcButton variant="operator" onClick={calculate}>
            =
          </CalcButton>
        </div>
      </div>
    </div>
  );
};
