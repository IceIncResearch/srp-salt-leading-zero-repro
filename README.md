# SRP-6a salt leading-zero mismatch (tssrp6a vs byte-oriented clients)

A small, runnable demonstration of an interoperability trap when pairing an SRP-6a
client that hashes the salt as literal bytes (for example, swift-srp) with a server
built on **tssrp6a**.

## The problem

`tssrp6a` represents the salt as a `bigint`. When it computes `x`, it converts that
bigint back to bytes with `bigIntToArrayBuffer`, which returns the *minimal* byte
representation. If the salt's first byte is `0x00`, that byte disappears, and the
server hashes 15 bytes where a byte-oriented client hashes 16. The two sides compute
different `x` values, so the proofs do not match and login fails with no useful error.

A random salt starts with `0x00` about 1 time in 256, so it shows up as an
intermittent failure that is hard to reproduce.

This is a compatibility trap, not a vulnerability.

## Run it

```bash
npm install
node repro.mjs
```

Requires Node 18+. Tested with `tssrp6a` 3.0.0 on Node 24.

Expected output: a salt beginning `00…` produces a mismatch; a salt beginning `a1…`
does not. See `images/terminal.png`.

## What this repro does and does not show

- It runs the **real tssrp6a** `computeX` on the same salt, once as tssrp6a handles it
  and once with the literal bytes hashed the way a byte-oriented client does.
- The "literal bytes" side is computed with tssrp6a's own hash routine, not by running
  swift-srp. The claim that swift-srp hashes the salt as a literal byte array comes from
  reading its behavior while integrating the two. Please correct us if that is wrong.
- It uses tssrp6a's default parameters (2048-bit group, SHA-512). The leading-zero effect
  does not depend on the hash: we also reproduced it with `SRPParameters.H.SHA256`, which
  is the configuration our client uses. Use the same group and hash on both sides.

## The fix we use

Normalize the salt on the client through the same bigint round trip tssrp6a uses
before hashing, so both sides hash the same bytes. We also compute the client and
server proofs with tssrp6a's `H(A|B|S)` scheme, because swift-srp's default proof
formula differs. We checked this byte for byte against tssrp6a with fixed test vectors
and then end to end against a running server.

## Licenses

tssrp6a is Apache-2.0. This repro depends on it and does not include its source.
