import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "BurnEngine - Focus on What Matters",
  description: "A productivity app that helps you focus on important tasks by visualizing the cost of distractions",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0, fontFamily: "Inter, sans-serif" }}>{children}</body>
    </html>
  )
}
