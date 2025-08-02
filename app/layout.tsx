import type React from "react"
import type { Metadata } from "next"
import { Fredoka, Comic_Neue, Quicksand } from "next/font/google"
import "./globals.css"

const fredoka = Fredoka({
  weight: ["400", "600"],
  subsets: ["latin"],
  variable: "--font-fredoka",
})

const comic = Comic_Neue({
  weight: ["300", "400", "700"],
  subsets: ["latin"],
  variable: "--font-comic",
})

const quicksand = Quicksand({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-quicksand",
})

export const metadata: Metadata = {
  title: "Candy Project",
  description: "A tasty candy game built for athena awards. Hope you enjoy :)",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${fredoka.variable} ${comic.variable} ${quicksand.variable} font-quicksand antialiased`}>
        {children}
      </body>
    </html>
  )
}