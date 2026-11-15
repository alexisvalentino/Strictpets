// Minimal RFC-6455 client (enough for the DevTools protocol) so the screenshot
// tool has no dependencies beyond Node itself.
const net = require('net');
const crypto = require('crypto');

class MiniWs {
  constructor(url) {
    const u = new URL(url);
    this.socket = net.connect(Number(u.port), u.hostname);
    this.buffer = Buffer.alloc(0);
    this.fragments = [];
    this.socket.write(
      `GET ${u.pathname}${u.search} HTTP/1.1\r\nHost: ${u.host}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n` +
        `Sec-WebSocket-Key: ${crypto.randomBytes(16).toString('base64')}\r\nSec-WebSocket-Version: 13\r\n\r\n`,
    );
    this.onmessage = () => {};
    this.ready = new Promise(resolve => (this._ready = resolve));
    this.socket.on('data', chunk => this._read(chunk));
    this.socket.on('error', () => {});
  }

  _read(chunk) {
    this.buffer = Buffer.concat([this.buffer, chunk]);
    if (!this.upgraded) {
      const end = this.buffer.indexOf('\r\n\r\n');
      if (end === -1) return;
      this.upgraded = true;
      this.buffer = this.buffer.subarray(end + 4);
      this._ready();
    }
    for (;;) {
      const b = this.buffer;
      if (b.length < 2) return;
      const fin = (b[0] & 0x80) !== 0;
      const opcode = b[0] & 0x0f;
      const len0 = b[1] & 0x7f;
      let offset = 2;
      let len = len0;
      if (len0 === 126) { if (b.length < 4) return; len = b.readUInt16BE(2); offset = 4; }
      else if (len0 === 127) { if (b.length < 10) return; len = Number(b.readBigUInt64BE(2)); offset = 10; }
      if (b.length < offset + len) return;
      const payload = b.subarray(offset, offset + len);
      this.buffer = b.subarray(offset + len);
      if (opcode === 0x1 || opcode === 0x0) {
        this.fragments.push(payload);
        if (fin) {
          const text = Buffer.concat(this.fragments).toString('utf8');
          this.fragments = [];
          this.onmessage(text);
        }
      }
    }
  }

  send(text) {
    const payload = Buffer.from(text, 'utf8');
    const len = payload.length;
    const header = len < 126 ? Buffer.from([0x81, 0x80 | len])
      : len < 65536 ? Buffer.from([0x81, 0x80 | 126, len >> 8, len & 0xff])
        : (() => { const h = Buffer.alloc(10); h[0] = 0x81; h[1] = 0xff; h.writeBigUInt64BE(BigInt(len), 2); return h; })();
    const mask = crypto.randomBytes(4);
    const masked = Buffer.from(payload);
    for (let i = 0; i < masked.length; i++) masked[i] ^= mask[i % 4];
    this.socket.write(Buffer.concat([header, mask, masked]));
  }

  close() { this.socket.destroy(); }
}

module.exports = { MiniWs };
