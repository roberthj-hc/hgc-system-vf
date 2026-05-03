"use client"

import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

export default function Page() {
  const router = useRouter()
  const [position, setPosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        x: e.clientX,
        y: e.clientY,
      })
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  return (
    <main className="relative min-h-svh flex items-center justify-center bg-background overflow-hidden px-6">

      <div
        className="pointer-events-none absolute inset-0 z-0 transition duration-300"
        style={{
          background: `radial-gradient(500px at ${position.x}px ${position.y}px, rgba(255, 200, 0, 0.15), transparent 70%)`,
        }}
      />

      <div className="relative z-10 w-full max-w-xl flex flex-col items-center text-center space-y-8">

        <div className="relative w-full h-[220px]">
          <Image
            src="/hgc-chicken.png"
            alt="Vista del sistema"
            fill
            className="object-contain"
            priority
          />
        </div>

        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-bold tracking-wide bg-gradient-to-r from-[#6B3E26] via-[#8B5E3C] to-[#4B2E1E] bg-clip-text text-transparent">
            HERMANOS
          </h1>

          <h2 className="text-3xl md:text-4xl font-bold tracking-wide bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-600 bg-clip-text text-transparent">
            GOLDEN CHICKEN
          </h2>
        </div>

        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Visualiza tu negocio de forma clara, entiende su progreso y toma mejores decisiones cada día.
        </p>

        <Button
          size="lg"
          className="mt-2"
          onClick={() => router.push("/auth/login")}
        >
          Ingresar
        </Button>

        <p className="text-xs text-muted-foreground pt-4">
          © {new Date().getFullYear()} HGC
        </p>
      </div>
    </main>
  )
}