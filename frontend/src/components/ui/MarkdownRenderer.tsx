import { useMemo } from "react";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inlineFormat(text: string): string {
  text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/__(.+?)__/g, "<strong>$1</strong>");
  text = text.replace(/\*([^*\n]+)\*/g, "<em>$1</em>");
  text = text.replace(/`([^`]+)`/g, '<code style="font-family:DM Mono,monospace;font-size:0.85em;background:rgba(255,255,255,0.06);color:#a3e635;padding:2px 6px;border-radius:4px;border:1px solid rgba(255,255,255,0.08)">$1</code>');
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" style="color:#a3e635;text-decoration:none;border-bottom:1px solid rgba(163,230,53,0.3)">$1</a>');
  return text;
}

export function MarkdownRenderer({ content }: { content: string }) {
  const html = useMemo(() => {
    const lines = content.split("\n");
    const output: string[] = [];
    let i = 0;
    let inCodeBlock = false;
    let codeLines: string[] = [];
    let codeLang = "";
    let inList = false;
    let listItems: string[] = [];

    const flushList = () => {
      if (inList && listItems.length > 0) {
        output.push(`<ul style="margin:8px 0 16px 0;padding-left:0;list-style:none;">`);
        listItems.forEach(item => {
          output.push(`<li style="position:relative;padding-left:20px;margin-bottom:6px;font-size:14px;color:var(--text-2);line-height:1.65;"><span style="position:absolute;left:0;color:#a3e635;font-size:10px;top:5px">▸</span>${inlineFormat(item)}</li>`);
        });
        output.push(`</ul>`);
        listItems = [];
        inList = false;
      }
    };

    while (i < lines.length) {
      const line = lines[i];

      if (line.startsWith("```")) {
        if (!inCodeBlock) {
          flushList();
          inCodeBlock = true;
          codeLang = line.slice(3).trim();
          codeLines = [];
        } else {
          inCodeBlock = false;
          const langLabel = codeLang || "code";
          output.push(`<div style="margin:16px 0;border-radius:10px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);"><div style="display:flex;align-items:center;padding:8px 14px;background:rgba(255,255,255,0.04);border-bottom:1px solid rgba(255,255,255,0.06);"><span style="font-family:DM Mono,monospace;font-size:11px;color:var(--text-3);text-transform:uppercase;letter-spacing:0.08em">${escapeHtml(langLabel)}</span></div><pre style="margin:0;padding:16px;background:rgba(0,0,0,0.3);overflow-x:auto;"><code style="font-family:DM Mono,monospace;font-size:12px;color:#c0c8d8;line-height:1.7;white-space:pre">${escapeHtml(codeLines.join("\n"))}</code></pre></div>`);
          codeLang = "";
          codeLines = [];
        }
        i++;
        continue;
      }

      if (inCodeBlock) { codeLines.push(line); i++; continue; }

      if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
        flushList();
        output.push(`<hr style="border:none;border-top:1px solid rgba(255,255,255,0.07);margin:24px 0;" />`);
        i++;
        continue;
      }

      if (line.startsWith("# ")) {
        flushList();
        output.push(`<h1 style="font-family:Syne,sans-serif;font-size:28px;font-weight:700;margin:8px 0 16px;color:var(--text-1);line-height:1.2;">${inlineFormat(line.slice(2))}</h1>`);
        i++;
        continue;
      }
      if (line.startsWith("## ")) {
        flushList();
        output.push(`<h2 style="font-family:Syne,sans-serif;font-size:20px;font-weight:700;margin:28px 0 10px;color:var(--text-1);padding-bottom:8px;border-bottom:1px solid rgba(255,255,255,0.06);">${inlineFormat(line.slice(3))}</h2>`);
        i++;
        continue;
      }
      if (line.startsWith("### ")) {
        flushList();
        output.push(`<h3 style="font-family:Syne,sans-serif;font-size:16px;font-weight:700;margin:20px 0 8px;color:var(--text-1);">${inlineFormat(line.slice(4))}</h3>`);
        i++;
        continue;
      }
      if (line.startsWith("#### ")) {
        flushList();
        output.push(`<h4 style="font-size:13px;font-weight:600;margin:16px 0 6px;color:var(--text-3);text-transform:uppercase;letter-spacing:0.06em;font-family:DM Mono,monospace;">${inlineFormat(line.slice(5))}</h4>`);
        i++;
        continue;
      }

      if (line.startsWith("> ")) {
        flushList();
        output.push(`<blockquote style="margin:12px 0;padding:10px 16px;border-left:3px solid rgba(163,230,53,0.4);background:rgba(163,230,53,0.04);border-radius:0 6px 6px 0;"><p style="margin:0;font-size:14px;color:var(--text-2);line-height:1.6;font-style:italic;">${inlineFormat(line.slice(2))}</p></blockquote>`);
        i++;
        continue;
      }

      if (/^[-*+] /.test(line)) {
        inList = true;
        listItems.push(line.slice(2));
        i++;
        continue;
      }

      if (/^\d+\. /.test(line)) {
        flushList();
        const num = line.match(/^(\d+)\. /)?.[1] ?? "1";
        output.push(`<div style="display:flex;gap:12px;margin-bottom:6px;"><span style="color:#a3e635;font-family:DM Mono,monospace;font-size:12px;min-width:20px;padding-top:2px;flex-shrink:0">${num}.</span><p style="margin:0;font-size:14px;color:var(--text-2);line-height:1.65;">${inlineFormat(line.replace(/^\d+\. /, ""))}</p></div>`);
        i++;
        continue;
      }

      if (line.trim() === "") {
        flushList();
        output.push(`<div style="height:8px;"></div>`);
        i++;
        continue;
      }

      flushList();
      output.push(`<p style="margin:0 0 10px;font-size:14px;color:var(--text-2);line-height:1.75;">${inlineFormat(line)}</p>`);
      i++;
    }

    flushList();
    return output.join("");
  }, [content]);

  return (
    <div
      style={{ color: "var(--text-2)", lineHeight: 1.7, overflowWrap: "break-word", wordBreak: "break-word" }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
