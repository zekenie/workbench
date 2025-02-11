import { IDE } from "./";
import {
  useFixtureSelect,
  useFixture,
  useFixtureInput,
} from "react-cosmos/client";

const languages = [
  "ts",
  "md",
  "sql",
  "http",
  "graphql",
  "json",
  "yaml",
  "toml",
] as const;

const stories = {};

for (const language of languages) {
  stories[language] = () => {
    const [width] = useFixtureInput("width", 500);
    const [height] = useFixtureInput("height", 500);

    const [isDarkMode] = useFixtureInput("isDarkMode", true);
    const [code] = useFixtureInput("code", "hello");

    return (
      <IDE
        code={code}
        width={width}
        height={height}
        isDarkMode={isDarkMode}
        onCodeChange={() => {}}
        language={language}
      />
    );
  };
}

export default stories;
