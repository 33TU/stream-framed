import { FramedReader, FramedWriter } from "../src/index.js";
import { createReadStream, createWriteStream } from "fs";

function read() {
  const reader = new FramedReader(createReadStream("hello.txt"));
  reader.readFunc = FramedReader.read8;

  reader.on("error", (err) => console.log(err));
  reader.on("len", (len) => console.log(len));
  reader.on("data", (data) => console.log(data.toString()));
}

function write() {
  const writer = new FramedWriter(createWriteStream("hello.txt"));
  writer.writeFunc = FramedWriter.write8;

  writer.writeBuffered("hello");
  writer.writeBuffered("world");
  writer.writeManyBuffered(["this", "is", "a", "test"]);
  writer.writeBuffered(Buffer.alloc(255));

  writer.writeable.end(read);
}

write();
