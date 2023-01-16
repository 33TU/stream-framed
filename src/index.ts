import { Readable, Writable } from "node:stream";
import EventEmitter from "node:events";

export type FramedReaderReadFunc = (
  reader: FramedReader,
  chunk: Buffer,
) => number;

export type FramedReaderReadOn = {
  ["data"]: (chunk: Buffer) => void;
  ["len"]: (len: number) => void;
  ["error"]: (err: any) => void;
};

export interface FramedReaderOptions {
  continueOnErr?: boolean;
}

export class FramedReader extends EventEmitter {
  public readonly readable: Readable;
  public readFunc: FramedReaderReadFunc;
  public options: FramedReaderOptions;

  private frameState: 0 | 1;
  private frameLength: number;
  private frameBuffer?: Buffer;
  private frameEmitError: boolean;

  constructor(readable: Readable, opts?: FramedReaderOptions) {
    super();

    this.readable = readable;
    this.readFunc = FramedReader.read32LE;
    this.options = opts ?? { continueOnErr: false };

    this.frameState = 0;
    this.frameLength = 0;
    this.frameEmitError = false;

    this.readable.on("data", this._onRead);
  }

  _stopOnErr(): boolean {
    return !this.options.continueOnErr && this.frameEmitError;
  }

  _onRead = (chunk: Buffer) => {
    if (this._stopOnErr()) return;

    const buffer = this.frameBuffer
      ? Buffer.concat([this.frameBuffer, chunk])
      : chunk;

    const consumed = this.readFunc(this, chunk);
    if (consumed === buffer.length) {
      this.frameBuffer = undefined;
    } else {
      this.frameBuffer = buffer.subarray(consumed);
    }
  };

  on<K extends Extract<keyof FramedReaderReadOn, string>>(
    eventName: K,
    listener: FramedReaderReadOn[K],
  ) {
    return super.on(eventName, listener);
  }

  emit<K extends Extract<keyof FramedReaderReadOn, string>>(
    eventName: K,
    args: any,
  ) {
    try {
      return super.emit(eventName, args);
    } catch (err) {
      this.frameEmitError = true;
      return super.emit("error", err);
    }
  }

  static read8(reader: FramedReader, chunk: Buffer): number {
    let consumed = 0;

    while (consumed !== chunk.length) {
      if (reader._stopOnErr()) {
        break;
      }

      if (
        reader.frameState === 0 && chunk.length - consumed >= 1
      ) {
        reader.frameLength = chunk.readUint8(consumed);
        reader.frameState = 1;

        consumed += 1;
        reader.emit("len", reader.frameLength);
      }

      if (reader._stopOnErr()) {
        break;
      }

      if (
        reader.frameState === 1 && chunk.length - consumed >= reader.frameLength
      ) {
        const frame = chunk.subarray(consumed, consumed + reader.frameLength);
        reader.frameState = 0;
        reader.frameLength = 0;

        consumed += frame.length;
        reader.emit("data", frame);
      } else {
        break;
      }
    }

    return consumed;
  }

  static read16LE(reader: FramedReader, chunk: Buffer): number {
    let consumed = 0;

    while (consumed !== chunk.length) {
      if (reader._stopOnErr()) {
        break;
      }

      if (
        reader.frameState === 0 && chunk.length - consumed >= 2
      ) {
        reader.frameLength = chunk.readUint16LE(consumed);
        reader.frameState = 1;

        consumed += 2;
        reader.emit("len", reader.frameLength);
      }

      if (reader._stopOnErr()) {
        break;
      }

      if (
        reader.frameState === 1 && chunk.length - consumed >= reader.frameLength
      ) {
        const frame = chunk.subarray(consumed, consumed + reader.frameLength);
        reader.frameState = 0;
        reader.frameLength = 0;

        consumed += frame.length;
        reader.emit("data", frame);
      } else {
        break;
      }
    }

    return consumed;
  }

  static read16BE(reader: FramedReader, chunk: Buffer): number {
    let consumed = 0;

    while (consumed !== chunk.length) {
      if (reader._stopOnErr()) {
        break;
      }

      if (
        reader.frameState === 0 && chunk.length - consumed >= 2
      ) {
        reader.frameLength = chunk.readUint16BE(consumed);
        reader.frameState = 1;

        consumed += 2;
        reader.emit("len", reader.frameLength);
      }

      if (reader._stopOnErr()) {
        break;
      }

      if (
        reader.frameState === 1 && chunk.length - consumed >= reader.frameLength
      ) {
        const frame = chunk.subarray(consumed, consumed + reader.frameLength);
        reader.frameState = 0;
        reader.frameLength = 0;

        consumed += frame.length;
        reader.emit("data", frame);
      } else {
        break;
      }
    }

    return consumed;
  }

  static read32LE(reader: FramedReader, chunk: Buffer): number {
    let consumed = 0;

    while (consumed !== chunk.length) {
      if (reader._stopOnErr()) {
        break;
      }

      if (
        reader.frameState === 0 && chunk.length - consumed >= 4
      ) {
        reader.frameLength = chunk.readUint32LE(consumed);
        reader.frameState = 1;

        consumed += 4;
        reader.emit("len", reader.frameLength);
      }

      if (reader._stopOnErr()) {
        break;
      }

      if (
        reader.frameState === 1 && chunk.length - consumed >= reader.frameLength
      ) {
        const frame = chunk.subarray(consumed, consumed + reader.frameLength);
        reader.frameState = 0;
        reader.frameLength = 0;

        consumed += frame.length;
        reader.emit("data", frame);
      } else {
        break;
      }
    }

    return consumed;
  }

  static read32BE(reader: FramedReader, chunk: Buffer): number {
    let consumed = 0;

    while (consumed !== chunk.length) {
      if (reader._stopOnErr()) {
        break;
      }

      if (
        reader.frameState === 0 && chunk.length - consumed >= 4
      ) {
        reader.frameLength = chunk.readUint32BE(consumed);
        reader.frameState = 1;

        consumed += 4;
        reader.emit("len", reader.frameLength);
      }

      if (reader._stopOnErr()) {
        break;
      }

      if (
        reader.frameState === 1 && chunk.length - consumed >= reader.frameLength
      ) {
        const frame = chunk.subarray(consumed, consumed + reader.frameLength);
        reader.frameState = 0;
        reader.frameLength = 0;

        consumed += frame.length;
        reader.emit("data", frame);
      } else {
        break;
      }
    }

    return consumed;
  }
}

export type FrameWriterFunc = (
  buffer: Buffer,
) => Buffer;

export class FramedWriter {
  public readonly writeable: Writable;
  public writeFunc: FrameWriterFunc;

  constructor(writeable: Writable) {
    this.writeable = writeable;
    this.writeFunc = FramedWriter.write32LE;
  }

  write(
    chunk: any,
    callback?: ((error: Error | null | undefined) => void) | undefined,
  ): boolean {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    const prefix = this.writeFunc(buffer);

    this.writeable.write(prefix);
    return this.writeable.write(buffer, callback);
  }

  writeBuffered(
    chunk: any,
    callback?: ((error: Error | null | undefined) => void) | undefined,
  ): boolean {
    try {
      this.writeable.cork();
      return this.write(chunk, callback);
    } finally {
      this.writeable.uncork();
    }
  }

  writeManyBuffered(
    chunks: any[],
    callback?: ((error: Error | null | undefined) => void) | undefined,
  ): boolean {
    try {
      let drain = false;
      let i = chunks.length;

      this.writeable.cork();

      for (const chunk of chunks) {
        drain = this.write(chunk, --i === 0 ? callback : undefined);
      }

      return drain;
    } finally {
      this.writeable.uncork();
    }
  }

  static write8(
    buffer: Buffer,
  ): Buffer {
    const bufferLen = Buffer.allocUnsafe(1);
    bufferLen.writeUint8(buffer.length);
    return bufferLen;
  }

  static write16LE(
    buffer: Buffer,
  ): Buffer {
    const bufferLen = Buffer.allocUnsafe(2);
    bufferLen.writeUint16LE(buffer.length);
    return bufferLen;
  }

  static write16BE(
    buffer: Buffer,
  ): Buffer {
    const bufferLen = Buffer.allocUnsafe(2);
    bufferLen.writeUint16BE(buffer.length);
    return bufferLen;
  }

  static write32LE(
    buffer: Buffer,
  ): Buffer {
    const bufferLen = Buffer.allocUnsafe(4);
    bufferLen.writeUint32LE(buffer.length);
    return bufferLen;
  }

  static write32BE(
    buffer: Buffer,
  ): Buffer {
    const bufferLen = Buffer.allocUnsafe(4);
    bufferLen.writeUint32BE(buffer.length);
    return bufferLen;
  }
}
