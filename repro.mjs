// Reproduces the salt serialization mismatch between a library that treats the
// salt as a bigint (tssrp6a) and one that hashes the salt as literal bytes
// (swift-srp). Run: node repro.mjs
import {
  SRPParameters,
  SRPRoutines,
  bigIntToArrayBuffer,
  arrayBufferToBigInt,
} from "tssrp6a";

const hex = (buf) => Buffer.from(new Uint8Array(buf)).toString("hex");
const fromHex = (h) => Uint8Array.from(Buffer.from(h, "hex"));

const routines = new SRPRoutines(new SRPParameters());
const I = "alice";
const P = "password123";

// Same 16-byte salt, once with a leading 0x00 byte and once without.
const salts = {
  "salt starts with 0x00": "00a1b2c3d4e5f60718293a4b5c6d7e8f",
  "salt starts with 0xa1": "a1a1b2c3d4e5f60718293a4b5c6d7e8f",
};

let mismatches = 0;
for (const [label, saltHex] of Object.entries(salts)) {
  const literal = fromHex(saltHex); // what a byte-oriented library hashes
  const asBigInt = arrayBufferToBigInt(literal); // what tssrp6a stores
  const reserialized = new Uint8Array(bigIntToArrayBuffer(asBigInt)); // what tssrp6a hashes

  const identityHash = await routines.computeIdentityHash(I, P);
  const xTssrp6a = await routines.computeX(I, asBigInt, P);
  const xLiteral = arrayBufferToBigInt(
    await routines.hash(literal, identityHash),
  );

  const same = xTssrp6a === xLiteral;
  if (!same) mismatches++;

  console.log(`\n${label}`);
  console.log(`  literal salt bytes   : ${saltHex}  (${literal.length} bytes)`);
  console.log(`  tssrp6a hashes bytes : ${hex(reserialized)}  (${reserialized.length} bytes)`);
  console.log(`  x (tssrp6a)          : ${xTssrp6a.toString(16).slice(0, 32)}...`);
  console.log(`  x (literal bytes)    : ${xLiteral.toString(16).slice(0, 32)}...`);
  console.log(`  same x?              : ${same ? "yes" : "NO  <-- mismatch"}`);
}

console.log(`\nmismatches: ${mismatches} of ${Object.keys(salts).length}`);
process.exit(0);
