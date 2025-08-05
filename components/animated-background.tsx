"use client"

import { useEffect } from "react"

export function AnimatedBackground() {
  useEffect(() => {
    const particlesContainer = document.getElementById("particles")
    if (!particlesContainer) return

    // Clear existing particles to avoid duplication on re-renders
    particlesContainer.innerHTML = ""

    const particleCount = 50
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement("div")
      particle.className = "particle"
      particle.style.left = `${Math.random() * 100}%`
      particle.style.animationDuration = `${Math.random() * 20 + 10}s`
      particle.style.animationDelay = `${Math.random() * 20}s`
      particlesContainer.appendChild(particle)
    }
  }, [])

  return (
    <>
      <div className="fixed top-0 left-0 w-full h-full z-[-2] bg-dark" />
      <div className="fixed top-0 left-0 w-full h-full z-[-1] bg-[radial-gradient(circle_at_20%_50%,_rgba(120,119,198,0.3)_0%,_transparent_50%),radial-gradient(circle_at_80%_80%,_rgba(255,119,198,0.3)_0%,_transparent_50%),radial-gradient(circle_at_40%_20%,_rgba(255,219,98,0.3)_0%,_transparent_50%)] filter blur-[100px] animate-backgroundMove" />
      <div className="fixed top-0 left-0 w-full h-full z-[-1] pointer-events-none overflow-hidden">
        <div className="absolute w-[300px] h-[300px] rounded-full bg-accent-purple top-[10%] left-[-150px] filter blur-[80px] opacity-40 animate-float" />
        <div
          className="absolute w-[300px] h-[300px] rounded-full bg-accent-pink bottom-[10%] right-[-150px] filter blur-[80px] opacity-40 animate-float"
          style={{ animationDelay: "-5s" }}
        />
        <div
          className="absolute w-[300px] h-[300px] rounded-full bg-accent-blue top-[50%] left-[50%] filter blur-[80px] opacity-40 animate-float"
          style={{ animationDelay: "-10s" }}
        />
      </div>
      <div id="particles" className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-[-1]">
        <style jsx>{`
          .particle {
            position: absolute;
            width: 4px;
            height: 4px;
            background: rgba(255, 255, 255, 0.5);
            border-radius: 50%;
            animation: particle-float linear infinite;
          }

          @keyframes particle-float {
            from {
              transform: translateY(100vh) scale(0);
            }
            to {
              transform: translateY(-10vh) scale(1);
            }
          }
        `}</style>
      </div>
    </>
  )
}
