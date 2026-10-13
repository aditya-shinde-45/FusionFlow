/**
 * Decimal-Safe Financial Calculations for Enterprise Payroll & Compensation
 * Avoids IEEE 754 floating point inaccuracies by computing in integer paise (1 INR = 100 paise)
 */

export class DecimalSafe {
  // Convert standard decimal float/string to paise (integer)
  static toPaise(amount) {
    if (typeof amount === "string") {
      amount = parseFloat(amount);
    }
    if (isNaN(amount) || amount === null || amount === undefined) {
      return 0n;
    }
    // Round to avoid precision loss on float multiplication
    return BigInt(Math.round(amount * 100));
  }

  // Convert paise (integer/BigInt) to decimal string (e.g. "12450.50")
  static toRupees(paise) {
    const p = typeof paise === "bigint" ? paise : BigInt(Math.round(paise || 0));
    const sign = p < 0n ? "-" : "";
    const abs = p < 0n ? -p : p;
    const whole = abs / 100n;
    const fraction = abs % 100n;
    return `${sign}${whole.toString()}.${fraction.toString().padStart(2, "0")}`;
  }

  // Convert paise to rounded number float (for JSON response)
  static toRupeesNumber(paise) {
    return parseFloat(DecimalSafe.toRupees(paise));
  }

  // Addition of multiple amounts
  static add(...amounts) {
    let total = 0n;
    for (const amt of amounts) {
      total += DecimalSafe.toPaise(amt);
    }
    return DecimalSafe.toRupeesNumber(total);
  }

  // Subtraction
  static subtract(a, b) {
    const diff = DecimalSafe.toPaise(a) - DecimalSafe.toPaise(b);
    return DecimalSafe.toRupeesNumber(diff);
  }

  // Multiplication with percentage rate (e.g. rate 12% = 0.12 or 12/100)
  static percent(amount, percentRate) {
    const paise = DecimalSafe.toPaise(amount);
    // multiply by rate*10000, then divide by 10000 to maintain high resolution
    const rateBps = BigInt(Math.round(percentRate * 100)); // e.g. 12% -> 1200
    const resPaise = (paise * rateBps + 5000n) / 10000n; // half-up rounding
    return DecimalSafe.toRupeesNumber(resPaise);
  }

  // Divide amount by integer days or parts (e.g. daily rate = monthly salary / daysInMonth)
  static divide(amount, divisor) {
    if (!divisor || divisor === 0) return 0;
    const paise = DecimalSafe.toPaise(amount);
    const div = BigInt(Math.round(divisor));
    const resPaise = (paise + div / 2n) / div;
    return DecimalSafe.toRupeesNumber(resPaise);
  }

  // Format currency for Indian Rupee displays
  static formatINR(amount) {
    const num = typeof amount === "number" ? amount : parseFloat(amount || 0);
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(num);
  }
}

