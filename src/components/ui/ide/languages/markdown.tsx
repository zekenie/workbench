import { markdown } from "@codemirror/lang-markdown";
import { mentions } from "@uiw/codemirror-extensions-mentions";

const users = [
  { label: "@Walter White" },
  { label: "@皮皮鲁" },
  { label: "@鲁西西" },
  { label: "@中本聪" },
  { label: "@サトシ・ナカモト" },
  { label: "@野比のび太" },
  { label: "@성덕선" },
];

const extensions = ({ dependencies }: { dependencies: string[] }) => [
  mentions(users),
  markdown(),
];

export default extensions;
