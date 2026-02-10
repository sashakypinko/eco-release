import { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useContainer } from "@/providers/ContainerProvider";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const { container } = useContainer();

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      setIsDark(true);
      container?.classList.add("dark");
    }
  }, [container]);

  const toggle = () => {
    setIsDark((prev) => {
      const next = !prev;
      if (next) {
        container?.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        container?.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }
      return next;
    });
  };

  return (
    <Button size="icon" variant="ghost" onClick={toggle} data-testid="button-theme-toggle">
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </Button>
  );
}
