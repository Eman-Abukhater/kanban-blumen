// src/pages/_document.tsx
import { Html, Head, Main, NextScript } from "next/document";

const setInitialTheme = `
(function() {
  try {
    var stored = localStorage.getItem('theme');

    // If user explicitly chose light → force light
    if (stored === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // stored === 'dark' OR null → keep dark
      document.documentElement.classList.add('dark');
    }
  } catch (e) {}
})();
`;

export default function Document() {
  return (
    // default SSR = dark
    <Html lang="en" className="dark">
      <Head>
        <script dangerouslySetInnerHTML={{ __html: setInitialTheme }} />

      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
