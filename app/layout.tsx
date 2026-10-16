import "./globals.css";

import React from "react";

import { Providers } from "~/components/providers";
import { TailwindIndicator } from "~/components/tailwind-indicator";
import * as fonts from "~/lib/fonts";
import { cn } from "~/lib/utils";

export const metadata = {
  title: "margin. — thoughtful english notes",
  description:
    "A private, distraction-free space for thoughtful English reading, vocabulary capture, and spaced repetition review.",
};

const RootLayout: React.FCC = ({ children }) => {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(Object.values(fonts).map((font) => font.variable))}
    >
      <body className="min-h-dvh font-sans antialiased">
        <Providers>{children}</Providers>
        <TailwindIndicator />
      </body>
    </html>
  );
};

export default RootLayout;
