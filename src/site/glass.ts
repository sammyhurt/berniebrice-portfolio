/**
 * Glass look preview. Off for everyone unless the address has ?glass=1 (remembered for the visit);
 * ?glass=0 turns it back off. Styles live under html.glass in global.css.
 */
const KEY = "bb-glass";

export function glassPreview(): boolean {
  try {
    const q = new URLSearchParams(location.search).get("glass");
    if (q === "1" || q === "on") sessionStorage.setItem(KEY, "1");
    if (q === "0" || q === "off") sessionStorage.removeItem(KEY);
    return sessionStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}
