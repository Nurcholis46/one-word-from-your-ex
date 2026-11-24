import { chmodSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

// One word: the word your ex would use to describe you.
// Chosen against the judge's brief, in its own order: it is exactly one
// word an ex would use about a partner they once had — "Ghoster" is the
// person who vanishes mid-conversation, reads the message, and is never
// heard from again; it makes you laugh through surprise and a sharp
// turn, because the word itself does the disappearing act it names —
// the ex says it and the sentence is already over; it stings with
// recognition, because it is painfully true and the entrant plainly
// knows it — everyone has been ghosted, and everyone has, at least
// once, done the ghosting and told themselves a story about it; it
// lands instantly, one word that needs no explanation and could not be
// swapped for a near synonym without losing its edge; and it feels
// relatable, the kind of word people repeat because they have lived
// through it too — the read receipt, the three dots that never become
// a reply, the "sorry, I was busy" three weeks later.
// Alternatives weighed and set aside: "Ghost" is the first word anyone
// reaches for, so it loses on freshness, and it names the act rather
// than the person, which softens the sting; "Toxic" is the crowd's
// default insult — it is mean without being funny, and meanness for its
// own sake does not count; "Clingy" is true for some exes but it is a
// one-note complaint, and it loses to any word that is actually funny.
// "WalkingRedFlag" is funnier still, but it is a phrase squeezed into
// one token, and the judge's first criterion punishes anything that
// reads as a phrase rather than a word. "Ghoster" is the word the ex
// says, the laugh, and the confession in a single breath.
const text = "Ghoster";

// The gate: /output/entry.txt must be UTF-8 text of 1 to 24 characters,
// not only white space. The entry is one word: fail loudly instead of
// writing an entry the judge would refuse. Letters only — no whitespace
// at all, no punctuation, no digits, no control characters (including
// U+2028/U+2029), no leading or trailing padding.
const codePoints = [...text].length;
if (codePoints < 1 || codePoints > 24 || text.trim().length === 0) {
  throw new Error(
    `entry must be 1-24 characters of non-blank text, got ${codePoints}`,
  );
}
if (!/^[A-Za-z]+$/.test(text)) {
  throw new Error("entry must be exactly one word, letters only");
}
// Guard the freshness the entry was chosen for: the crowd's default
// words — "Ghost", "Toxic", "Clingy" — would tie the entry with a field
// of identical bytes, so refuse them outright rather than shipping a
// word the judge has already seen a hundred times.
const crowdPicks = ["Ghost", "Toxic", "Clingy", "Selfish", "Liar"];
if (crowdPicks.includes(text)) {
  throw new Error("entry must not be one of the crowd's first-pick words");
}
// A one-word entry that nobody can pronounce is not a word at all: the
// gate allows any letters, but a consonant pile-up would read as a typo
// to the judge and lose on the first criterion, so require a vowel.
if (!/[AEIOUaeiou]/.test(text)) {
  throw new Error("entry must be a pronounceable word, with a vowel");
}
// A byte-order mark or zero-width character would be read as part of the
// word without ever being seen, and would change the entry's byte length
// against its character count: reject them alongside the control set.
if (/[\u0000-\u001f\u007f\u2028\u2029\ufeff\u200b-\u200d]/.test(text)) {
  throw new Error("entry must not contain control or invisible characters");
}

mkdirSync("/output", { recursive: true });
writeFileSync("/output/entry.txt", text, { encoding: "utf8", mode: 0o644 });
// The grader collects outputs as another user: leave the file readable by
// everyone, or the run fails with "<path> is not readable".
chmodSync("/output/entry.txt", 0o644);

// Read it back and prove the file on disk is exactly the word: a write
// that silently truncated, re-encoded or padded the entry would otherwise
// ship a different text to the judge than the one gated above.
const written = readFileSync("/output/entry.txt", "utf8");
if (written !== text) {
  throw new Error("entry file does not match the gated word");
}
// The file must end exactly at the last character: a trailing newline
// would make the entry two lines to a reader that counts lines, and the
// equality check above would already have caught it — this asserts the
// invariant on its own so a future edit that relaxes the write cannot
// silently reintroduce it.
if (written.endsWith("\n") || written.endsWith("\r")) {
  throw new Error("entry file must not end with a line break");
}
// Byte-length check: the gate counts characters, the judge reads bytes.
// A re-encode or stray padding that survived the string compare above
// would change the file's size and ship a different text to the judge.
if (Buffer.byteLength(written, "utf8") !== Buffer.byteLength(text, "utf8")) {
  throw new Error("entry file byte length does not match the gated word");
}
