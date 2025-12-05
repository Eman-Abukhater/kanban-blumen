// src/pages/_document.tsx
import { Html, Head, Main, NextScript } from "next/document";

const setInitialTheme = `
(function() {
  try {
    var stored = localStorage.getItem('theme');

    // If user explicitly chose light before → remove dark
    if (stored === 'light') {
      document.documentElement.classList.remove('dark');
    }
    // If stored is 'dark' or null, we keep the SSR "dark" class.
  } catch (e) {
    // fail silently
  }
})();
`;

export default function Document() {
  return (
    // ⭐ SSR default: dark
    <Html lang="en" className="dark">
      <Head>
        {/* runs ASAP, can switch back to light if needed */}
        <script dangerouslySetInnerHTML={{ __html: setInitialTheme }} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
