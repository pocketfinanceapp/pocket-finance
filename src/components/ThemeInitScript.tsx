import { THEME_STORAGE_KEY } from "@/lib/theme";

/** Runs before paint to avoid theme flash. Defaults to dark (not system). */
export function ThemeInitScript() {
  const script = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var pref=localStorage.getItem(k)||'dark';if(pref==='modern-light')pref='light';var resolved=pref;if(pref==='system'){resolved=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}else if(pref!=='dark'&&pref!=='light'){resolved='dark';}document.documentElement.setAttribute('data-theme',resolved);}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;

  return (
    <script
      id="pf-theme-init"
      dangerouslySetInnerHTML={{ __html: script }}
    />
  );
}
