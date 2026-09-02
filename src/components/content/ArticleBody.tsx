import { parseArticleBody } from "@/lib/toc";

export function ArticleBody({ body }: { body: string }) {
  const blocks = parseArticleBody(body);
  return (
    <div className="max-w-3xl text-lg leading-9">
      {blocks.map((block, i) => {
        if (block.type === "h2") {
          return (
            <h2 key={block.id} id={block.id} className="mt-10 scroll-mt-28 text-2xl font-semibold">
              {block.text}
            </h2>
          );
        }
        if (block.type === "h3") {
          return (
            <h3 key={block.id} id={block.id} className="mt-6 scroll-mt-28 text-xl font-semibold">
              {block.text}
            </h3>
          );
        }
        return (
          <p key={i} className="mt-4 whitespace-pre-line">
            {block.text}
          </p>
        );
      })}
    </div>
  );
}
