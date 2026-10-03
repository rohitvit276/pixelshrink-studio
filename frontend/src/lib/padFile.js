// Grow a file to a target byte size by adding filler data the format itself allows,
// so the result is still a valid file that looks exactly the same when opened.
// - JPEG: comment (COM) segments placed after the APPn headers
// - PNG:  a private ancillary chunk placed before IEND
// - PDF:  an unused stream object referenced from the document catalog

const JPEG_MAX_COM_PAYLOAD = 65533;
const JPEG_COM_OVERHEAD = 4;
const PNG_CHUNK_OVERHEAD = 12;
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
// "pxSz": ancillary, private, safe-to-copy — decoders skip chunks they don't know.
const PNG_PAD_TYPE = [0x70, 0x78, 0x53, 0x7a];
const PDF_MAX_PASSES = 5;

let crcTable = null;
function crc32(bytes) {
  if (!crcTable) {
    crcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n += 1) {
      let c = n;
      for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crcTable[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) crc = crcTable[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

export function isJpeg(bytes) {
  return bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

export function isPng(bytes) {
  return bytes.length > 8 && PNG_SIGNATURE.every((b, i) => bytes[i] === b);
}

export function padJpeg(bytes, targetBytes) {
  if (!isJpeg(bytes)) throw new Error('Not a valid JPEG file.');
  const needed = targetBytes - bytes.length;
  if (needed <= 0) return bytes;

  // Skip past the APPn segments (JFIF / EXIF / ICC) so those stay first in the file.
  let insertAt = 2;
  while (insertAt + 4 <= bytes.length && bytes[insertAt] === 0xff && bytes[insertAt + 1] >= 0xe0 && bytes[insertAt + 1] <= 0xef) {
    insertAt += 2 + ((bytes[insertAt + 2] << 8) | bytes[insertAt + 3]);
  }
  if (insertAt > bytes.length) throw new Error('This JPEG looks corrupted.');

  const segments = [];
  let remaining = Math.max(needed, JPEG_COM_OVERHEAD);
  while (remaining > 0) {
    // Never leave a tail too small to hold a segment header.
    let payload = Math.min(JPEG_MAX_COM_PAYLOAD, remaining - JPEG_COM_OVERHEAD);
    const tail = remaining - payload - JPEG_COM_OVERHEAD;
    if (tail > 0 && tail < JPEG_COM_OVERHEAD) payload -= JPEG_COM_OVERHEAD - tail;
    segments.push(payload);
    remaining -= payload + JPEG_COM_OVERHEAD;
  }

  const added = segments.reduce((sum, p) => sum + p + JPEG_COM_OVERHEAD, 0);
  const out = new Uint8Array(bytes.length + added);
  out.set(bytes.subarray(0, insertAt), 0);
  let pos = insertAt;
  segments.forEach((payload) => {
    const len = payload + 2;
    out[pos] = 0xff; out[pos + 1] = 0xfe; out[pos + 2] = len >> 8; out[pos + 3] = len & 0xff;
    pos += JPEG_COM_OVERHEAD + payload;
  });
  out.set(bytes.subarray(insertAt), pos);
  return out;
}

export function padPng(bytes, targetBytes) {
  if (!isPng(bytes)) throw new Error('Not a valid PNG file.');
  const needed = targetBytes - bytes.length;
  if (needed <= 0) return bytes;

  let iendAt = -1;
  let pos = 8;
  while (pos + 12 <= bytes.length) {
    const len = ((bytes[pos] << 24) | (bytes[pos + 1] << 16) | (bytes[pos + 2] << 8) | bytes[pos + 3]) >>> 0;
    if (bytes[pos + 4] === 0x49 && bytes[pos + 5] === 0x45 && bytes[pos + 6] === 0x4e && bytes[pos + 7] === 0x44) { iendAt = pos; break; }
    pos += PNG_CHUNK_OVERHEAD + len;
  }
  if (iendAt < 0) throw new Error('This PNG looks corrupted.');

  const dataLen = Math.max(needed, PNG_CHUNK_OVERHEAD) - PNG_CHUNK_OVERHEAD;
  const chunk = new Uint8Array(PNG_CHUNK_OVERHEAD + dataLen);
  chunk[0] = dataLen >>> 24; chunk[1] = (dataLen >>> 16) & 0xff; chunk[2] = (dataLen >>> 8) & 0xff; chunk[3] = dataLen & 0xff;
  chunk.set(PNG_PAD_TYPE, 4);
  const crc = crc32(chunk.subarray(4, 8 + dataLen));
  const crcAt = 8 + dataLen;
  chunk[crcAt] = crc >>> 24; chunk[crcAt + 1] = (crc >>> 16) & 0xff; chunk[crcAt + 2] = (crc >>> 8) & 0xff; chunk[crcAt + 3] = crc & 0xff;

  const out = new Uint8Array(bytes.length + chunk.length);
  out.set(bytes.subarray(0, iendAt), 0);
  out.set(chunk, iendAt);
  out.set(bytes.subarray(iendAt), iendAt + chunk.length);
  return out;
}

export async function padPdf(bytes, targetBytes) {
  const { PDFDocument, PDFName } = await import('pdf-lib');
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false });
  if (doc.isEncrypted) throw new Error('Password-protected PDFs are not supported. Remove the password first.');

  const ref = doc.context.nextRef();
  doc.catalog.set(PDFName.of('PixelShrinkPadding'), ref);
  const save = (padLen) => {
    doc.context.assign(ref, doc.context.stream(new Uint8Array(padLen)));
    return doc.save({ useObjectStreams: false });
  };

  // The padding length is itself written into the file, so converge on the exact size.
  let padLen = 0;
  let out = await save(padLen);
  for (let pass = 0; pass < PDF_MAX_PASSES && out.length !== targetBytes; pass += 1) {
    const next = padLen + (targetBytes - out.length);
    if (next < 0) break;
    padLen = next;
    out = await save(padLen);
  }
  return out;
}
