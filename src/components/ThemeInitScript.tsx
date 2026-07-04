import { THEME_STORAGE_KEY } from "@/lib/theme";

/** Runs before paint to avoid theme flash. */
export function ThemeInitScript() {
  const script = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var t=localStorage.getItem(k)||'dark';if(t!=='dark'&&t!=='light'&&t!=='modern-light')t='dark';document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;

  return (
    <script
      id="pf-theme-init"
      dangerouslySetInnerHTML={{ __html: script }}
    />
  );
}
