function percentage(num1, num2) {
  if (num1 === 0 || num2 === 0)
    return 0;
  return Math.round(num1 / num2 * 100);
}
function roundToDecimal(value, decimals) {
  const val = typeof value === "string" ? parseFloat(value) : value;
  const dec = typeof decimals === "string" ? parseInt(decimals, 10) : decimals;
  return Number(Math.round(val + "e" + dec) + "e-" + dec);
}

export { percentage as p, roundToDecimal as r };
//# sourceMappingURL=math-098b0747.mjs.map
