const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];
const monthsAbbr = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const daysAbbr = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const units = {
  year: 24 * 60 * 60 * 1e3 * 365,
  month: 24 * 60 * 60 * 1e3 * 365 / 12,
  week: 24 * 60 * 60 * 1e3 * 7,
  day: 24 * 60 * 60 * 1e3,
  hour: 60 * 60 * 1e3,
  minute: 60 * 1e3,
  second: 1e3
};
const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
function getRelativeTime(d1, d2 = /* @__PURE__ */ new Date()) {
  if (!(d1 instanceof Date))
    d1 = new Date(d1);
  const elapsed = d1.getTime() - d2.getTime();
  for (const u in units) {
    if (Math.abs(elapsed) > units[u] || u === "second") {
      return rtf.format(Math.round(elapsed / units[u]), u);
    }
  }
  return "";
}
function getFriendlyDate(dateString, { monthAbbr = {} } = {}) {
  const d = new Date(dateString);
  const year = d.getFullYear();
  const date = d.getDate();
  const dateSuffix = (date2) => {
    if (date2 > 3 && date2 < 21)
      return "th";
    switch (date2 % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };
  const monthIndex = d.getMonth();
  const monthName = monthAbbr ? monthsAbbr[monthIndex] : months[monthIndex];
  const dayName = daysAbbr[d.getDay()];
  const formatted = `${dayName}, ${monthName} ${date}${dateSuffix(date)}, ${year}`;
  return formatted;
}
function greetUser() {
  const hour = (/* @__PURE__ */ new Date()).getHours();
  if (hour < 12)
    return "Good morning";
  if (hour < 18)
    return "Good afternoon";
  return "Good evening";
}

export { getRelativeTime as a, greetUser as b, getFriendlyDate as g };
//# sourceMappingURL=time-37ce8841.mjs.map
