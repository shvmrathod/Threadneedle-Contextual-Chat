// Split an assistant message into "blocks" — each block gets its own
// Reply / Explain buttons in the UI.
//
// Rules (intentionally simple, tune as needed):
//   - Fenced code blocks (```...```) are one block.
//   - Numbered list items (1. foo, 2. bar) are one block each.
//   - Bullet items (-, *, •) are one block each.
//   - Otherwise, paragraphs are split by blank lines.
//
// Each block keeps its raw markdown; the caller decides how to render it.

const NUMBERED = /^\s*\d+[.)]\s+/;
const BULLET = /^\s*[-*•]\s+/;

export function splitBlocks(markdown) {
  if (!markdown) return [];

  const blocks = [];
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");

  let i = 0;
  let buffer = [];

  const flushParagraph = () => {
    const text = buffer.join("\n").trim();
    if (text) blocks.push({ kind: "paragraph", text });
    buffer = [];
  };

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block — consume until closing fence.
    if (/^\s*```/.test(line)) {
      flushParagraph();
      const start = i;
      i++;
      while (i < lines.length && !/^\s*```/.test(lines[i])) i++;
      const end = Math.min(i, lines.length - 1);
      blocks.push({
        kind: "code",
        text: lines.slice(start, end + 1).join("\n"),
      });
      i++;
      continue;
    }

    // List item — each item is its own block, including any indented
    // continuation lines until the next item or blank line.
    if (NUMBERED.test(line) || BULLET.test(line)) {
      flushParagraph();
      const itemLines = [line];
      i++;
      while (
        i < lines.length &&
        lines[i].trim() !== "" &&
        !NUMBERED.test(lines[i]) &&
        !BULLET.test(lines[i]) &&
        /^\s+/.test(lines[i]) // continuation must be indented
      ) {
        itemLines.push(lines[i]);
        i++;
      }
      blocks.push({
        kind: NUMBERED.test(line) ? "numbered" : "bullet",
        text: itemLines.join("\n").trim(),
      });
      continue;
    }

    // Blank line ends a paragraph.
    if (line.trim() === "") {
      flushParagraph();
      i++;
      continue;
    }

    buffer.push(line);
    i++;
  }
  flushParagraph();

  return blocks.map((b, idx) => ({ ...b, id: idx }));
}
