/**
 * Convert a number into Thai Baht text representation.
 * Handles millions, decimal satangs, and standard Thai Baht grammatical rules (e.g., "เอ็ด", "ยี่สิบ").
 */
export function convertToThaiBahtText(num: number): string {
  if (num === null || num === undefined || isNaN(num)) return "ศูนย์บาทถ้วน";
  if (num === 0) return "ศูนย์บาทถ้วน";

  // Force absolute and round to 2 decimal places to avoid float issues
  const isNegative = num < 0;
  const absNum = Math.abs(num);
  const rounded = Math.round(absNum * 100) / 100;
  
  const parts = rounded.toFixed(2).split(".");
  const integerPart = parts[0];
  const decimalPart = parts[1] || "00";

  const thaiNumbers = ["ศูนย์", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];
  const thaiPositions = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน"];

  const convertGroup = (digits: string): string => {
    let result = "";
    const len = digits.length;
    for (let i = 0; i < len; i++) {
      const digit = parseInt(digits[i], 10);
      const pos = len - 1 - i;
      if (digit !== 0) {
        if (pos === 0 && digit === 1 && len > 1) {
          result += "เอ็ด";
        } else if (pos === 1 && digit === 1) {
          result += "สิบ";
        } else if (pos === 1 && digit === 2) {
          result += "ยี่สิบ";
        } else {
          result += thaiNumbers[digit] + thaiPositions[pos];
        }
      }
    }
    return result;
  };

  const convertInteger = (digits: string): string => {
    if (digits === "0" || digits === "" || parseInt(digits, 10) === 0) return "ศูนย์";
    
    let result = "";
    // Handle million groupings
    const segments: string[] = [];
    let current = digits;
    while (current.length > 6) {
      segments.unshift(current.slice(-6));
      current = current.slice(0, -6);
    }
    if (current.length > 0) {
      segments.unshift(current);
    }
    
    for (let i = 0; i < segments.length; i++) {
      result += convertGroup(segments[i]);
      if (i < segments.length - 1) {
        result += "ล้าน";
      }
    }
    return result;
  };

  const intVal = parseInt(integerPart, 10);
  const decVal = parseInt(decimalPart, 10);

  let intText = "";
  if (intVal > 0) {
    intText = convertInteger(integerPart) + "บาท";
  } else if (decVal > 0) {
    // If only satangs are present (e.g. 0.50 Baht)
    intText = "";
  } else {
    return "ศูนย์บาทถ้วน";
  }

  let decText = "";
  if (decVal > 0) {
    decText = convertGroup(decimalPart) + "สตางค์";
  } else {
    decText = "ถ้วน";
  }

  const resultText = (isNegative ? "ลบ" : "") + intText + decText;
  return resultText;
}
