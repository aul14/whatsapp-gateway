const phoneNumberFormatter = function (number) {
  // 1. MENGHILANGKAN KARAKTER SELAIN ANGKA
  let formatted = number.replace(/\D/g, "");

  // 2. MENGHILANGKAN ANGKA 0 DIDEPAN DAN DIGANTIKAN DENGAN 62
  if (formatted.startsWith("0")) {
    formatted = "62" + formatted.substr(1);
  }

  if (!formatted.endsWith("@c.us")) {
    formatted += "@c.us";
  }

  return formatted;
};

module.exports = {
  phoneNumberFormatter,
};
