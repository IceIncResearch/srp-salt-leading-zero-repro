# Posts and notes (drafts for you to edit and publish)

Before posting anywhere: read that community's self-promotion rule, post from an
account with some history if you can, and don't paste the same text into many places
at once. Put the repro repo link where it says [LINK]. Attach `images/salt-bytes.png`
(and `images/terminal.png` if the venue allows more than one image).

---

## 1. Reddit — r/swift, r/iOSProgramming (friendly tone)

**Title:** Gotcha pairing swift-srp with tssrp6a: salts starting with 0x00 break login

While building a password manager I hit an intermittent SRP login failure that took a
while to track down. Posting it in case it saves someone the headache.

`tssrp6a` stores the salt as a bigint and converts it back to bytes before hashing, which
drops a leading `0x00`. A byte-oriented client (we use swift-srp) hashes the full 16
bytes. When a random salt happens to start with `0x00`, about 1 time in 256, the two
sides hash different bytes, `x` differs, the proof is wrong, and login fails with no
clear error.

Fix on our side: run the salt through the same bigint round trip before hashing, and
compute the proofs with tssrp6a's `H(A|B|S)` scheme, since swift-srp's default proof
formula is different. We checked it against fixed test vectors and then end to end
against a real server.

Runnable repro with the real tssrp6a (one command): [LINK]

To be clear, this isn't a vulnerability, just a compatibility trap. Has anyone else run
into it, or found a cleaner way to handle it? Happy to be corrected if I've misread
how either library behaves.

*We're a new small business building iOS and security components and taking custom
builds, so feedback is very welcome.*

---

## 2. Reddit — r/cryptography (drier, no hype)

**Title:** Salt serialization mismatch between bigint-based and byte-based SRP-6a implementations

In SRP-6a, `x = H(s | H(I:P))`. tssrp6a holds `s` as a bigint and serializes it back
with a minimal-length encoding, so a salt whose first byte is `0x00` is hashed as
15 bytes instead of 16. An implementation that hashes the salt as a literal byte array
computes a different `x`. Both are internally consistent; they disagree only when the
two are paired.

Impact is availability, not security: authentication fails for roughly 1 in 256
randomly generated salts. I don't see a confidentiality or forgery issue.

Reproduction against the real library, with expected output: [LINK]

Questions: is minimal-length encoding of `s` the intended behavior here, and is there
a recommended convention for interop (fixed-width salt, or length-prefix)? Corrections
welcome. I'm a developer integrating these, not a cryptographer.

*(Small plug, per the sub rules if allowed: we're a new business building
security-focused iOS components.)*

---

## 3. Cryptography Stack Exchange (self-answered question)

**Question title:** SRP-6a login fails intermittently between a Swift client and a tssrp6a server. Why?

Describe the symptom (works for most accounts, fails for roughly 1 in 256), then answer
it yourself with the explanation in section 1 and a link to the repro. Don't add any
promotion to the answer body. Mention the business only in your profile.

---

## 4. Short note to the maintainers (send before posting publicly)

**To the swift-srp and tssrp6a maintainers**

Hi, thanks for both libraries. While pairing swift-srp (client) with tssrp6a (server) we
found that a salt beginning with `0x00` is hashed as 16 bytes by a byte-oriented client
but as 15 bytes by tssrp6a, because the salt is held as a bigint and re-serialized in
minimal form. About 1 in 256 random salts are affected, and the symptom is a failed proof
with no error. Minimal repro using tssrp6a 3.0.0: [LINK]. Is this intended, and would a
note in the README about interoperability make sense? We are happy to open a PR. If I've
misread either library, please tell me.

---

## 5. Hacker News / Lobsters (optional, after the above)

Title: "SRP-6a: a salt starting with 0x00 breaks login between two correct libraries"
Link the repro, not a sales page. Put any business mention in your profile.
