/**
 * Reads a browser File as base64 so the backend can read the actual bytes.
 * Returns undefined for plain {name,size,type} objects (used by unit tests), which carry no content.
 */
export async function fileToBase64(file: File | { name: string; size: number; type: string }): Promise<string | undefined> {
  if (typeof (file as File).arrayBuffer !== 'function') return undefined;
  const bytes = new Uint8Array(await (file as File).arrayBuffer());
  let binary = '';
  const chunk = 0x8000; // avoid call-stack limits on large files
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}
