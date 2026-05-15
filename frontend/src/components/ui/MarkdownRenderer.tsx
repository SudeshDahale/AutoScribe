export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-bold prose-code:rounded prose-code:bg-gray-100 dark:prose-code:bg-white/10 prose-code:px-1 prose-code:text-violet-600 dark:prose-code:text-violet-400">
      {content.split("\n").map((line, i) => {
        if (line.startsWith("# "))
          return <h1 key={i} className="text-2xl font-bold mt-6 mb-3 text-gray-900 dark:text-gray-100">{line.slice(2)}</h1>;
        if (line.startsWith("## "))
          return <h2 key={i} className="text-lg font-semibold mt-5 mb-2 text-gray-800 dark:text-gray-200">{line.slice(3)}</h2>;
        if (line.startsWith("### "))
          return <h3 key={i} className="text-base font-semibold mt-4 mb-1 text-gray-700 dark:text-gray-300">{line.slice(4)}</h3>;
        if (line.startsWith("- ") || line.startsWith("* "))
          return <li key={i} className="ml-5 list-disc text-sm text-gray-600 dark:text-gray-400">{line.slice(2)}</li>;
        if (line.startsWith("```"))
          return <div key={i} className="border-t border-dashed border-gray-200 dark:border-white/10 my-3" />;
        if (line.trim() === "")
          return <div key={i} className="h-2" />;
        return <p key={i} className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">{line}</p>;
      })}
    </div>
  );
}