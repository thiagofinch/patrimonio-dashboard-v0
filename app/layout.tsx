import type React from "react"
import type { Metadata } from "next"
import { Poppins } from "next/font/google"
import "./globals.css"
import { BucketsProvider } from "@/context/buckets-context"
import { AppContainer } from "@/components/app-container"
import { Toaster } from "@/components/ui/toaster"
import { GlobalTransacaoModal } from "@/components/global-transacao-modal"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
})

export const metadata: Metadata = {
  title: "Patrimônio Financeiro | Dashboard",
  description: "Gestão inteligente de patrimônio e investimentos.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={poppins.className}>
        <BucketsProvider>
          <AppContainer>{children}</AppContainer>
          <GlobalTransacaoModal />
          <Toaster />
        </BucketsProvider>
      </body>
    </html>
  )
}
