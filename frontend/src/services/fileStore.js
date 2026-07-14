/**
 * fileStore.js
 * A simple in-memory store for File objects that cannot be serialized
 * through React Router's navigation state (History API).
 *
 * Usage:
 *   import { setIdFile, getIdFile, clearIdFile } from './fileStore';
 *   setIdFile(file);       // set before navigating
 *   const f = getIdFile(); // read on the destination page
 *   clearIdFile();         // clean up after use
 */

let _idFile = null;

export const setIdFile  = (file) => { _idFile = file; };
export const getIdFile  = ()     => _idFile;
export const clearIdFile = ()    => { _idFile = null; };
