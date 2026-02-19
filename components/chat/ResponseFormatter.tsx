import { parseMarkdown, FormattedContent } from '@/lib/markdown';
import { cn } from '@/lib/utils';

interface ResponseFormatterProps {
  content: string;
  className?: string;
}

export function ResponseFormatter({ content, className }: ResponseFormatterProps) {
  const formatted = parseMarkdown(content);

  return (
    <div className={cn('space-y-2 text-sm leading-relaxed', className)}>
      {formatted.map((block, idx) => (
        <FormattedBlock key={idx} block={block} />
      ))}
    </div>
  );
}

interface FormattedBlockProps {
  block: FormattedContent;
}

function FormattedBlock({ block }: FormattedBlockProps) {
  switch (block.type) {
    case 'heading': {
      const sizeClass = {
        1: 'text-lg font-bold',
        2: 'text-base font-bold',
        3: 'text-sm font-semibold',
      }[block.level || 1] || 'text-sm font-semibold';

      return (
        <div className={cn(sizeClass, 'mt-3 mb-2')}>
          {renderInlineContent(block.content)}
        </div>
      );
    }

    case 'codeblock': {
      return (
        <pre className="bg-black/30 p-3 rounded text-xs font-mono overflow-x-auto border border-foreground/10">
          <code>{block.content}</code>
        </pre>
      );
    }

    case 'listitem': {
      return (
        <div className="ml-4 flex gap-2">
          <span className="text-muted-foreground">•</span>
          <div>{renderInlineContent(block.content)}</div>
        </div>
      );
    }

    case 'paragraph': {
      return (
        <div>
          {renderInlineContent(block.content)}
        </div>
      );
    }

    case 'text': {
      return <span>{block.content}</span>;
    }

    default:
      return <div>{block.content}</div>;
  }
}

function renderInlineContent(content: string | FormattedContent[]): React.ReactNode {
  if (typeof content === 'string') {
    return content;
  }

  return (
    <>
      {content.map((item, idx) => (
        <InlineElement key={idx} item={item} />
      ))}
    </>
  );
}

interface InlineElementProps {
  item: FormattedContent;
}

function InlineElement({ item }: InlineElementProps) {
  switch (item.type) {
    case 'bold':
      return <strong className="font-semibold">{item.content}</strong>;

    case 'italic':
      return <em className="italic">{item.content}</em>;

    case 'code':
      return (
        <code className="bg-black/30 px-1.5 py-0.5 rounded text-xs font-mono">
          {item.content}
        </code>
      );

    case 'text':
      return <span>{item.content}</span>;

    default:
      return <span>{item.content}</span>;
  }
}
