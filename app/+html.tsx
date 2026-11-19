import type { PropsWithChildren } from 'react';
import { ScrollViewStyleReset, useServerDocumentContext } from 'expo-router/html';

export default function RootHtml({children}:PropsWithChildren) {
  const {headNodes,bodyNodes,htmlAttributes,bodyAttributes}=useServerDocumentContext();
  return <html lang="ko" {...htmlAttributes}>
    <head>
      <meta charSet="utf-8" />
      <title>Re:on</title>
      <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
      <meta name="referrer" content="no-referrer-when-downgrade" />
      <ScrollViewStyleReset />
      {headNodes}
    </head>
    <body {...bodyAttributes}>{children}{bodyNodes}</body>
  </html>;
}
