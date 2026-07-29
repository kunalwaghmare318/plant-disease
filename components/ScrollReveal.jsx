'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const LeafCanvas = dynamic(() => import('./LeafCanvas'), { ssr: false });

/**
 * ScrollReveal — single-pinned hero container with stationary 3D leaf model on right,
 * scroll-scrubbed text reveal on left, and next section sliding up to cover.
 */
export default function ScrollReveal({ sections, videoSrc }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const classifierEl = document.querySelector('#classifier-section');
      const slideBlocks = gsap.utils.toArray('.hero-slide-block');
      const dotEls = gsap.utils.toArray('.hero-dot');

      if (!slideBlocks.length) return;

      // Master timeline pinning the entire hero container for all slides + cover reveal
      const masterTl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: '+=450%', // 4.5x viewport height total scroll distance
          pin: true,
          scrub: 0.5,
          anticipatePin: 1,
        },
      });

      const totalSlides = slideBlocks.length;
      const stepDuration = 2; // duration per slide

      slideBlocks.forEach((block, index) => {
        const startTime = index * stepDuration;
        const greenLayers = block.querySelectorAll('.green-layer');
        const glowLayers = block.querySelectorAll('.sweep-glow');

        // 1. Fade in current slide (if not first slide)
        if (index > 0) {
          masterTl.fromTo(
            block,
            { opacity: 0, y: 30, display: 'none' },
            { opacity: 1, y: 0, display: 'block', duration: 0.5 },
            startTime
          );
        }

        // 2. Animate word-by-word green color reveal & glow
        greenLayers.forEach((green, gIdx) => {
          masterTl.fromTo(
            green,
            { clipPath: 'inset(0 100% 0 0)' },
            { clipPath: 'inset(0 0% 0 0)', duration: 1, ease: 'none' },
            startTime + 0.3 + gIdx * 0.2
          );
        });

        glowLayers.forEach((glow, gIdx) => {
          const parent = glow.parentElement;
          masterTl.fromTo(
            glow,
            { x: -80, opacity: 0 },
            {
              x: () => (parent ? parent.offsetWidth : 300),
              opacity: 0.85,
              duration: 1,
              ease: 'none',
            },
            startTime + 0.3 + gIdx * 0.2
          );
        });

        // 3. Highlight pagination dot for current slide
        dotEls.forEach((dot, dIdx) => {
          masterTl.to(
            dot,
            {
              backgroundColor: dIdx === index ? '#B6FF2A' : 'rgba(255,255,255,0.2)',
              scale: dIdx === index ? 1.4 : 1,
              duration: 0.3,
            },
            startTime
          );
        });

        // 4. Fade out current slide before next slide begins (if not last slide)
        if (index < totalSlides - 1) {
          masterTl.to(
            block,
            { opacity: 0, y: -30, display: 'none', duration: 0.5 },
            startTime + stepDuration - 0.4
          );
        }
      });

      // 5. COVER REVEAL: Section 05 text & 3D leaf remain frozen while Classifier slides up from translateY(100%) to translateY(0)
      if (classifierEl) {
        const coverStartTime = totalSlides * stepDuration;
        masterTl.fromTo(
          classifierEl,
          { yPercent: 100 },
          { yPercent: 0, duration: 2.5, ease: 'none' },
          coverStartTime
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, [sections]);

  return (
    <div ref={containerRef} className="relative w-full h-screen overflow-hidden bg-black">
      {/* 1. Hero Video Backdrop (z-0) — completely stationary inside pinned hero */}
      <div className="absolute inset-0 z-0">
        <video
          className="w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          src={videoSrc}
        />
        <div className="absolute inset-0 bg-black/50" />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.3) 50%, transparent 85%)',
          }}
        />
      </div>

      {/* 2. 3D Leaf Model Canvas (z-30) — stationary on right side, zero scroll drift */}
      <div className="absolute top-0 right-0 w-full lg:w-[48%] h-screen z-30 pointer-events-none flex items-center justify-center p-6 md:p-10">
        <div className="w-full h-[65vh] max-h-[580px] pointer-events-auto">
          <LeafCanvas />
        </div>
      </div>

      {/* 3. Text Slides Container (z-20) — left column text scrub */}
      <div className="absolute inset-0 z-20 flex items-center pointer-events-none">
        <div className="w-full max-w-7xl mx-auto px-6 md:px-12 lg:px-16 pointer-events-none">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-8 pointer-events-none">
            {/* Left Column: Text Slides */}
            <div className="lg:col-span-7 relative h-[320px] flex items-center pointer-events-auto">
              {sections.map((section, i) => (
                <div
                  key={i}
                  className="hero-slide-block absolute inset-x-0"
                  style={{
                    display: i === 0 ? 'block' : 'none',
                    opacity: i === 0 ? 1 : 0,
                  }}
                >
                  <div className="flex items-start gap-4 md:gap-8">
                    {/* Section Number */}
                    <span className="hidden md:block text-[13px] font-semibold tracking-[0.2em] text-white/30 mt-3 shrink-0 tabular-nums">
                      {section.number}
                    </span>

                    {/* Headline & Subcopy */}
                    <div className="w-full max-w-xl">
                      {section.lines.map((line, j) => (
                        <div key={j} className="reveal-line mb-1 md:mb-2 relative overflow-hidden">
                          <h2 className="gray-layer hero-headline">{line}</h2>
                          <h2 className="green-layer hero-headline">{line}</h2>
                          <div className="sweep-glow" />
                        </div>
                      ))}

                      <div className="reveal-line mt-4 md:mt-6 relative overflow-hidden">
                        <p className="gray-layer hero-subcopy">{section.subcopy}</p>
                        <p className="green-layer hero-subcopy">{section.subcopy}</p>
                        <div className="sweep-glow" />
                      </div>

                      {/* Pagination Dots */}
                      <div className="flex gap-2 mt-8">
                        {sections.map((_, idx) => (
                          <span
                            key={idx}
                            className="hero-dot w-2 h-2 rounded-full transition-all duration-300"
                            style={{
                              background: idx === i ? '#B6FF2A' : 'rgba(255,255,255,0.2)',
                              transform: idx === i ? 'scale(1.4)' : 'scale(1)',
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Column Spacer for 3D Leaf */}
            <div className="hidden lg:block lg:col-span-5 h-[500px]" />
          </div>
        </div>
      </div>
    </div>
  );
}
