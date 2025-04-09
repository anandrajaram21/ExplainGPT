import InnerHTML from "dangerously-set-html-content";

export default function Dangerous({ html }: { html: string }) {
  return <InnerHTML html={html} />;
}
