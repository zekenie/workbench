import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Language } from "./types";

export function LanguageDropdown({
  className,
  onSelect,
  language,
}: {
  className?: string;
  onSelect: (language: Language) => void;
  language: Language;
}) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button className={className + " font-mono"} size="sm" variant="ghost">
          {language}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        onPointerDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        className="w-56 font-mono"
      >
        <DropdownMenuLabel>Code</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuCheckboxItem
            checked={language === "ts"}
            onSelect={() => onSelect("ts")}
          >
            Typescript
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={language === "md"}
            onSelect={() => onSelect("md")}
          >
            Markdown
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={language === "sql"}
            onSelect={() => onSelect("sql")}
          >
            SQL
          </DropdownMenuCheckboxItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        <DropdownMenuLabel>Remote</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuCheckboxItem
            checked={language === "http"}
            onSelect={() => onSelect("http")}
          >
            HTTP
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={language === "graphql"}
            onSelect={() => onSelect("graphql")}
          >
            GraphQL
          </DropdownMenuCheckboxItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        <DropdownMenuLabel>Data</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuCheckboxItem
            checked={language === "json"}
            onSelect={() => onSelect("json")}
          >
            JSON
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={language === "yaml"}
            onSelect={() => onSelect("yaml")}
          >
            YAML
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={language === "toml"}
            onSelect={() => onSelect("toml")}
          >
            TOML
          </DropdownMenuCheckboxItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
