import countries from "world-countries";

// Build a lookup: country common name -> currency code
const nameToCurrency: Record<string, string> = {};

for (const country of countries) {
  const name = country.name.common;
  const currencyCodes = Object.keys(country.currencies || {});
  if (currencyCodes.length > 0) {
    nameToCurrency[name] = currencyCodes[0];
  }
}

export function getCurrencyForCountry(country: string): string {
  const trimmed = country.trim();

  // Exact match first
  if (nameToCurrency[trimmed]) {
    return nameToCurrency[trimmed];
  }

  // Case-insensitive fallback match
  const match = Object.keys(nameToCurrency).find(
    (name) => name.toLowerCase() === trimmed.toLowerCase()
  );

  return match ? nameToCurrency[match] : "USD";
}