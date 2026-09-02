export type TocItem = { id: string; text: string; level: 2 | 3 };

export function extractToc(body: string): TocItem[] {
  const items: TocItem[] = [];
  let i = 0;
  for (const line of body.split("\n")) {
    const match = /^(#{2,3})\s+(.+)$/.exec(line.trim());
    if (!match) continue;
    i += 1;
    items.push({
      id: `s-${i}`,
      text: match[2].trim(),
      level: match[1].length === 3 ? 3 : 2,
    });
  }
  return items;
}

export type BodyBlock = { type: "h2" | "h3" | "p"; id?: string; text: string };

export function parseArticleBody(body: string): BodyBlock[] {
  const blocks: BodyBlock[] = [];
  let heading = 0;
  let para: string[] = [];

  const flush = () => {
    const text = para.join("\n").trim();
    if (text) blocks.push({ type: "p", text });
    para = [];
  };

  for (const line of body.split("\n")) {
    const match = /^(#{2,3})\s+(.+)$/.exec(line.trim());
    if (match) {
      flush();
      heading += 1;
      blocks.push({
        type: match[1].length === 3 ? "h3" : "h2",
        id: `s-${heading}`,
        text: match[2].trim(),
      });
    } else {
      para.push(line);
    }
  }
  flush();
  return blocks;
}
