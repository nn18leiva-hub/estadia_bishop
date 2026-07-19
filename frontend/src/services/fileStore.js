/**
 * fileStore.js
 * Persists the ID file across React Router navigation AND mobile browser
 * context resets (e.g. iOS Safari reopening after the file picker).
 *
 * Strategy:
 *  - In-memory reference (`_idFile`) for normal SPA navigation.
 *  - sessionStorage base64 blob (`_SESSION_KEY`) as a fallback when the
 *    in-memory value is lost (e.g. iOS page reload triggered by file picker).
 *
 * Usage:
 *   import { setIdFile, getIdFile, clearIdFile } from './fileStore';
 *   await setIdFile(file);       // call with await — encodes to sessionStorage
 *   const f = await getIdFile(); // returns File (or null)
 *   clearIdFile();               // clean up after use
 */

const SESSION_KEY = 'bmhs_id_file';
const SESSION_META_KEY = 'bmhs_id_file_meta';

let _idFile = null;

/**
 * Store a File object both in-memory and as a base64 string in sessionStorage.
 * Returns a Promise so callers can await it.
 */
export const setIdFile = (file) => {
  if (!file) { clearIdFile(); return Promise.resolve(); }
  _idFile = file;

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        sessionStorage.setItem(SESSION_KEY, reader.result); // data URL (base64)
        sessionStorage.setItem(SESSION_META_KEY, JSON.stringify({ name: file.name, type: file.type }));
      } catch (e) {
        // sessionStorage quota exceeded — silently ignore, in-memory copy still works
        console.warn('fileStore: could not persist to sessionStorage', e);
      }
      resolve();
    };
    reader.onerror = () => resolve(); // still resolve so navigation isn't blocked
    reader.readAsDataURL(file);
  });
};

/**
 * Retrieve the stored File. Returns the in-memory File if available,
 * otherwise reconstructs it from sessionStorage.
 * Returns null if nothing is stored.
 */
export const getIdFile = () => {
  if (_idFile) return _idFile;

  try {
    const dataUrl = sessionStorage.getItem(SESSION_KEY);
    const metaRaw = sessionStorage.getItem(SESSION_META_KEY);
    if (!dataUrl || !metaRaw) return null;

    const { name, type } = JSON.parse(metaRaw);
    // Convert data URL → Blob → File
    const arr = dataUrl.split(',');
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    const blob = new Blob([u8arr], { type });
    const file = new File([blob], name, { type });
    _idFile = file; // cache back in memory
    return file;
  } catch (e) {
    console.warn('fileStore: could not restore from sessionStorage', e);
    return null;
  }
};

/**
 * Clear both the in-memory reference and the sessionStorage entry.
 */
export const clearIdFile = () => {
  _idFile = null;
  try {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_META_KEY);
  } catch (e) { /* ignore */ }
};
