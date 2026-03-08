import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

interface ChatMarkdownProps {
  content: string;
  className?: string;
}

export function ChatMarkdown({ content, className }: ChatMarkdownProps) {
  return (
    <div className={cn("chat-markdown", className)}>
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1 className="text-base font-bold text-foreground mt-3 mb-1.5 first:mt-0">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm font-bold text-foreground mt-3 mb-1.5 first:mt-0 border-b border-border/40 pb-1">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-semibold text-foreground mt-2.5 mb-1 first:mt-0">{children}</h3>
          ),
          p: ({ children }) => (
            <p className="text-sm leading-relaxed mb-2 last:mb-0">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="text-sm space-y-1 mb-2 last:mb-0 ml-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="text-sm space-y-1 mb-2 last:mb-0 ml-1 list-decimal list-inside">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="flex items-start gap-1.5">
              <span className="text-primary mt-1.5 shrink-0 h-1.5 w-1.5 rounded-full bg-primary inline-block" />
              <span className="flex-1">{children}</span>
            </li>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-muted-foreground">{children}</em>
          ),
          code: ({ className, children, ...props }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-mono" {...props}>
                  {children}
                </code>
              );
            }
            return (
              <div className="my-2 rounded-xl overflow-hidden border border-border/50">
                <div className="bg-muted/80 px-3 py-1.5 text-[10px] font-mono text-muted-foreground uppercase tracking-wider border-b border-border/50">
                  {className?.replace("language-", "") || "code"}
                </div>
                <pre className="p-3 overflow-x-auto bg-muted/40">
                  <code className="text-xs font-mono text-foreground leading-relaxed" {...props}>
                    {children}
                  </code>
                </pre>
              </div>
            );
          },
          pre: ({ children }) => <>{children}</>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-primary/50 pl-3 my-2 text-sm text-muted-foreground italic">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-3 border-border/50" />,
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors">
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-2 rounded-lg border border-border/50">
              <table className="w-full text-xs">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="px-3 py-1.5 text-left font-semibold bg-muted/60 border-b border-border/50">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-1.5 border-b border-border/30">{children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
