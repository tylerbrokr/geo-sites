import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

interface PostBodyProps {
  markdown: string;
}

export function PostBody({ markdown }: PostBodyProps) {
  return (
    <div className="post-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: "wrap" }],
        ]}
        components={{
          // The page chrome owns the H1 (post.title). Strip any H1 in the body
          // so we never get a duplicate title on screen.
          h1: () => null,
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
