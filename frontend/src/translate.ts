export function changeLanguage(lang: string) {
  const maxAttempts = percentageToMs(5000);
  let attempts = 0;

  const interval = setInterval(() => {
    attempts += 300;

    const select = document.querySelector(
      '.goog-te-combo'
    ) as HTMLSelectElement | null;

    if (!select) {
      if (attempts >= maxAttempts) clearInterval(interval);
      return;
    }

    const options = Array.from(select.options);

    const match =
      options.find(o => o.value === lang) ||
      options.find(o => o.value.endsWith(`|${lang}`)) ||
      options.find(o => o.value.includes(lang));

    if (!match) return;

    select.value = match.value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    
    // Trigger additional events to ensure Google Translate responds
    select.dispatchEvent(new Event('input', { bubbles: true }));
    select.dispatchEvent(new Event('blur', { bubbles: true }));

    clearInterval(interval);
  }, 300);
}

function percentageToMs(ms: number) {
  return ms;
}
