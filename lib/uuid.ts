/**
 * RFC-4122 v4 UUID generator with no native dependency.
 *
 * Uses a Web-Crypto CSPRNG when the runtime exposes one and falls back to
 * Math.random otherwise, so it works everywhere without linking a native
 * module. Single-user local IDs don't need cryptographic strength, but we
 * prefer the strong source when it's available.
 */

type CryptoLike = { getRandomValues<T extends Uint8Array>(array: T): T };

function cryptoSource(): CryptoLike | null {
  const g = globalThis as unknown as { crypto?: CryptoLike };
  return g.crypto && typeof g.crypto.getRandomValues === 'function'
    ? g.crypto
    : null;
}

function randomBytes(len: number): Uint8Array {
  const buf = new Uint8Array(len);
  const source = cryptoSource();
  if (source) return source.getRandomValues(buf);
  for (let i = 0; i < len; i += 1) {
    buf[i] = Math.floor(Math.random() * 256);
  }
  return buf;
}

const HEX: string[] = [];
for (let i = 0; i < 256; i += 1) {
  HEX.push((i + 0x100).toString(16).slice(1));
}

export function uuid(): string {
  const b = randomBytes(16);
  // Per RFC 4122 §4.4: set version (4) and variant (10xx) bits.
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  return (
    HEX[b[0]] +
    HEX[b[1]] +
    HEX[b[2]] +
    HEX[b[3]] +
    '-' +
    HEX[b[4]] +
    HEX[b[5]] +
    '-' +
    HEX[b[6]] +
    HEX[b[7]] +
    '-' +
    HEX[b[8]] +
    HEX[b[9]] +
    '-' +
    HEX[b[10]] +
    HEX[b[11]] +
    HEX[b[12]] +
    HEX[b[13]] +
    HEX[b[14]] +
    HEX[b[15]]
  );
}
