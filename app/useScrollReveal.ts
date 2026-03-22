"use client";

import { useEffect } from 'react';

export function useScrollReveal() {
  useEffect(() => {
    // Small delay to ensure DOM is fully painted before observing
    const timer = setTimeout(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              observer.unobserve(entry.target);
            }
          });
        },
        {
          threshold: 0.08,
          rootMargin: '0px 0px -32px 0px',
        }
      );

      const elements = document.querySelectorAll('.reveal, .reveal-scale, .reveal-stagger');

      if (elements.length === 0) return;

      elements.forEach((el) => {
        // Immediately show elements already in the viewport
        const rect = el.getBoundingClientRect();
        const alreadyVisible = rect.top < window.innerHeight && rect.bottom > 0;
        if (alreadyVisible) {
          el.classList.add('is-visible');
        } else {
          observer.observe(el);
        }
      });

      return () => observer.disconnect();
    }, 200);

    return () => clearTimeout(timer);
  }, []);
}