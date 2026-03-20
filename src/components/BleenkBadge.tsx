'use client'

import { useEffect, useRef, useState } from 'react'

export default function BleenkBadge() {
  const [logoError, setLogoError] = useState(false)
  const [isOnWhite, setIsOnWhite] = useState(false)
  const badgeRef = useRef<HTMLAnchorElement | null>(null)

  useEffect(() => {
    const checkBackground = () => {
      if (!badgeRef.current) return

      const checkY = window.innerHeight - 20
      const checkX = window.innerWidth - 20
      const originalDisplay = badgeRef.current.style.display
      badgeRef.current.style.display = 'none'

      const elementBelow = document.elementFromPoint(checkX, checkY)

      badgeRef.current.style.display = originalDisplay

      if (!elementBelow) return

      let current: Element | null = elementBelow

      while (current && current !== document.body) {
        if (current instanceof HTMLElement) {
          const classList = current.classList

          for (let index = 0; index < classList.length; index += 1) {
            const className = classList[index]

            if (
              className.startsWith('bg-white') ||
              className.startsWith('bg-gray-50') ||
              className.startsWith('bg-gray-100')
            ) {
              setIsOnWhite(true)
              return
            }

            if (
              className.startsWith('bg-black') ||
              className.startsWith('bg-gray-900') ||
              className.startsWith('bg-gray-800')
            ) {
              setIsOnWhite(false)
              return
            }
          }

          const backgroundColor = window.getComputedStyle(current).backgroundColor

          if (backgroundColor && backgroundColor !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'transparent') {
            const rgb = backgroundColor.match(/\d+/g)

            if (rgb && rgb.length >= 3) {
              const red = Number.parseInt(rgb[0], 10)
              const green = Number.parseInt(rgb[1], 10)
              const blue = Number.parseInt(rgb[2], 10)
              const brightness = (red * 299 + green * 587 + blue * 114) / 1000

              setIsOnWhite(brightness > 128)
              return
            }
          }
        }

        current = current.parentElement
      }
    }

    const timeoutId = window.setTimeout(checkBackground, 500)

    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          checkBackground()
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', checkBackground)

    return () => {
      window.clearTimeout(timeoutId)
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', checkBackground)
    }
  }, [])

  return (
    <a
      ref={badgeRef}
      href="https://bleenk.app"
      target="_blank"
      rel="noopener noreferrer"
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 14px',
        borderRadius: 12,
        boxShadow: '0 12px 24px rgba(15, 23, 42, 0.18)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        textDecoration: 'none',
        backgroundColor: isOnWhite ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)',
        border: `1px solid ${isOnWhite ? 'rgb(31, 41, 55)' : 'rgb(229, 231, 235)'}`,
        transition: 'background-color 500ms ease-in-out, border-color 500ms ease-in-out',
      }}
    >
      {!logoError && (
        <img
          src="/bleenk.svg"
          alt="Bleenk"
          style={{ height: 18, width: 'auto', opacity: 0.8, flexShrink: 0 }}
          onError={() => setLogoError(true)}
        />
      )}
      <span
        style={{
          fontSize: '0.75rem',
          fontWeight: 500,
          color: isOnWhite ? 'rgb(255, 255, 255)' : 'rgb(55, 65, 81)',
          lineHeight: 1,
          transition: 'color 500ms ease-in-out',
        }}
      >
        Built with Bleenk
      </span>
    </a>
  )
}
