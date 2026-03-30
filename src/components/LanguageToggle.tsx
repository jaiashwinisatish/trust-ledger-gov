import { useTranslation } from "react-i18next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";

export default function LanguageToggle() {
  const { i18n } = useTranslation();

  const toggleLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-10 w-10 rounded-xl glass-card border-none hover:bg-accent/50 group transition-all"
        >
          <Languages className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
          <span className="sr-only">Toggle language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="glass-card border-none rounded-2xl min-w-[140px] p-2 mt-2">
        <DropdownMenuItem 
          onClick={() => toggleLanguage("en")}
          className="font-bold text-xs uppercase tracking-widest rounded-xl m-1 cursor-pointer focus:bg-primary/10 focus:text-primary"
        >
          English
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => toggleLanguage("hi")}
          className="font-bold text-xs uppercase tracking-widest rounded-xl m-1 cursor-pointer focus:bg-primary/10 focus:text-primary"
        >
          हिन्दी (Hindi)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
