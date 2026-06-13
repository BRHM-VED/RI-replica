// Reidius Infra - Main Script

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initScrollAnimations();
  initStatsCounter();
  initCursorGlow();
  initTestimonials();
  initDownloadPortfolio();
  initLazyLoading();
  initBgLazyLoading();
  initNativeIcons();
});

// Navbar active states & responsive drawer
function initNavbar() {
  const header = document.querySelector('.header');
  const hamburger = document.querySelector('.hamburger');
  const navMenu = document.querySelector('.nav-menu');
  const navLinks = document.querySelectorAll('.nav-link');

  // Add scroll class to navbar
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // Mobile menu toggle
  if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      navMenu.classList.toggle('open');
    });

    // Close menu when link is clicked
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        navMenu.classList.remove('open');
      });
    });
  }

  // Highlight active link based on current path
  const currentPath = window.location.pathname;
  const pageName = currentPath.substring(currentPath.lastIndexOf('/') + 1);
  
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === pageName || (pageName === '' && href === 'index.html')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

// Scroll driven layout reveals
function initScrollAnimations() {
  const reveals = document.querySelectorAll('.reveal');
  
  const revealCallback = (entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        // Once revealed, no need to watch it anymore
        observer.unobserve(entry.target);
      }
    });
  };

  const revealObserver = new IntersectionObserver(revealCallback, {
    root: null,
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  });

  reveals.forEach(element => {
    revealObserver.observe(element);
  });
}

// Interactive numerical counters for accomplishments
function initStatsCounter() {
  const statsElements = document.querySelectorAll('[data-target-counter]');
  if (statsElements.length === 0) return;

  const countTo = (element) => {
    const target = parseInt(element.getAttribute('data-target-counter'));
    const suffix = element.getAttribute('data-counter-suffix') || '';
    const duration = 2000; // ms
    const stepTime = 30; // ms
    const stepCount = duration / stepTime;
    const increment = target / stepCount;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        element.textContent = target + suffix;
        clearInterval(timer);
      } else {
        element.textContent = Math.floor(current) + suffix;
      }
    }, stepTime);
  };

  const statsObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        countTo(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  statsElements.forEach(stat => {
    statsObserver.observe(stat);
  });
}

// Custom Cursor Glow Tracker in Hero sections
function initCursorGlow() {
  const glowContainers = document.querySelectorAll('.cursor-glow-container');
  
  glowContainers.forEach(container => {
    container.addEventListener('mousemove', (e) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      container.style.setProperty('--mouse-x', `${x}px`);
      container.style.setProperty('--mouse-y', `${y}px`);
    });
  });
}

// Interactive Testimonial Slider
function initTestimonials() {
  const testimonialTrack = document.querySelector('.testimonial-track');
  const dots = document.querySelectorAll('.testimonial-dot');
  
  if (!testimonialTrack || dots.length === 0) return;
  
  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      const index = dot.getAttribute('data-index');
      
      // Update active dot
      dots.forEach(d => d.classList.remove('active'));
      dot.classList.add('active');
      
      // Slide content
      testimonialTrack.style.transform = `translateX(-${index * 100}%)`;
    });
  });
}

// Fix Download Portfolio button (Framer hides the <a> overlay with opacity:0
// and relies on React hydration, which breaks in offline/static mode)
function initDownloadPortfolio() {
  // Use the renamed, human-readable PDF path directly.
  // Hardcoded so it works regardless of what Framer's hydration does to the DOM.
  const pdfUrl = 'assets/ReidiusInfra_Portfoliio.pdf';

  function triggerDownload() {
    const a = document.createElement('a');
    a.href = pdfUrl;
    // No target="_blank" — browsers ignore `download` when target is _blank
    a.download = 'ReidiusInfra_Portfoliio.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function wire() {
    const hiddenContainers = document.querySelectorAll('.framer-86meoo-container');
    hiddenContainers.forEach((container) => {
      if (container._dpFixed) return;
      container._dpFixed = true;

      const parent = container.parentElement;
      if (!parent) return;

      parent.style.cursor = 'pointer';
      parent.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        triggerDownload();
      });
    });
  }

  // Run immediately (SSR HTML already has the elements)
  wire();

  // Re-run after Framer's React hydration re-renders the tree
  const observer = new MutationObserver(wire);
  observer.observe(document.body, { childList: true, subtree: true });
  // Stop observing after 10s (hydration is always done by then)
  setTimeout(() => observer.disconnect(), 10000);
}

// Global lazy-loader for dynamically injected image tags
function initLazyLoading() {
  const setLazy = (img) => {
    if (!img) return;

    // Determine if the image is above-the-fold/primary
    const isAboveFold = () => {
      // 1. Check if inside header, hero section, or navigation
      if (img.closest('header') || img.closest('.hero') || img.closest('[data-framer-name*="Hero" i]') || img.closest('[data-framer-name*="Navbar" i]')) {
        return true;
      }
      
      // 2. Check if it's one of the first 3 images in document order
      const allImgs = Array.from(document.querySelectorAll('img'));
      const index = allImgs.indexOf(img);
      if (index >= 0 && index < 3) {
        return true;
      }
      
      return false;
    };

    if (isAboveFold()) {
      img.setAttribute('loading', 'eager');
      img.setAttribute('fetchpriority', 'high');
    } else {
      if (!img.hasAttribute('loading')) {
        img.setAttribute('loading', 'lazy');
      }
    }
  };

  // Watch for any images added dynamically by React/Framer
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.tagName === 'IMG') {
          setLazy(node);
        } else if (node.querySelectorAll) {
          node.querySelectorAll('img').forEach(setLazy);
        }
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Apply lazy loading to any images currently on the page
  document.querySelectorAll('img').forEach(setLazy);
}

// Global lightweight CSS background lazy loader
function initBgLazyLoading() {
  const lazyBgs = document.querySelectorAll('.lazy-bg, [data-bg]');
  
  const loadBg = (el) => {
    const bgUrl = el.getAttribute('data-bg');
    if (bgUrl) {
      el.style.backgroundImage = `url('${bgUrl}')`;
    }
    el.classList.add('bg-loaded');
  };

  const bgObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        loadBg(el);
        observer.unobserve(el);
      }
    });
  }, {
    root: null,
    rootMargin: '100px', // Pre-load backgrounds 100px before they enter viewport
    threshold: 0.01
  });

  // Check if background element is above the fold
  const checkAndObserve = (el) => {
    const isAboveFold = el.closest('header') || el.closest('[data-framer-name*="Hero" i]') || el.closest('[data-framer-name*="Navbar" i]');
    if (isAboveFold) {
      loadBg(el);
    } else {
      bgObserver.observe(el);
    }
  };

  // Watch for existing elements
  lazyBgs.forEach(checkAndObserve);

  // Watch for any dynamically injected background elements
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          if (node.classList.contains('lazy-bg') || node.hasAttribute('data-bg')) {
            checkAndObserve(node);
          }
          node.querySelectorAll('.lazy-bg, [data-bg]').forEach(checkAndObserve);
        }
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

// Map of card names to native SVG icons (Lucide-style)
const NAME_ICON_MAP = {
  "Construction & Management": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d0c412" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-hammer"><path d="m15 5 4 4"/><path d="M21.5 2.5a2.5 2.5 0 0 0-3.5 0L10 10l-4 4v4h4l4-4 7.5-8a2.5 2.5 0 0 0 0-3.5Z"/><path d="m7 21-4.3-4.3c-.4-.4-.4-1 0-1.4l1.4-1.4c.4-.4 1-.4 1.4 0L9.8 18.2c.4.4.4 1 0 1.4L8.4 21c-.4.4-1 .4-1.4 0Z"/><path d="m14 10 3 3"/></svg>`,
  
  "Commercial Design": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d0c412" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-building"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M8 10h.01"/><path d="M16 10h.01"/><path d="M8 14h.01"/><path d="M16 14h.01"/></svg>`,
  
  "Interior Design & Construction": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d0c412" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sofa"><path d="M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3"/><path d="M2 16a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M4 18v2"/><path d="M20 18v2"/><path d="M12 4v9"/></svg>`,
  
  "Home design & construction": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d0c412" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-home"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  
  "Vastu Consultation": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d0c412" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-compass"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>`
};

// URL-based fallback map for elements without descriptive text names (like slider arrows)
const URL_ICON_MAP = {
  // Card keys as fallback
  'hZverpXkvx0VBcNmVFct': NAME_ICON_MAP["Construction & Management"],
  'S2H55LFeD7gQiWbMZCL': NAME_ICON_MAP["Commercial Design"],
  'vZkkLuRJkp37uvzRJHx': NAME_ICON_MAP["Interior Design & Construction"],
  'ATELiCCX2Dk8hJ4XDcK': NAME_ICON_MAP["Home design & construction"],
  'ZXrwLocLsxJ0jTEGNdrGu3IvLU': NAME_ICON_MAP["Vastu Consultation"],
  
  // Testimonial Navigation Arrows
  '6tTbkXggWgQCAJ4DO2QE': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-left"><path d="m15 18-6-6 6-6"/></svg>`,
  '11KSGbIZoRSg4pjdnUoi': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-right"><path d="m9 18 6-6-6-6"/></svg>`
};

// Traverse up parent elements to check if we can identify the card name
function getCardName(img) {
  if (!img) return null;
  let parent = img.parentElement;
  for (let i = 0; i < 5; i++) {
    if (!parent) break;
    const text = parent.textContent || "";
    const cleanText = text.replace(/\s+/g, ' ').trim();
    if (/Construction\s*&\s*Management/i.test(cleanText) || /Construction\s*&/i.test(cleanText)) {
      return "Construction & Management";
    }
    if (/Commercial\s*Design/i.test(cleanText) || /Commercial/i.test(cleanText)) {
      return "Commercial Design";
    }
    if (/Interior\s*Design/i.test(cleanText)) {
      return "Interior Design & Construction";
    }
    if (/Home\s*design/i.test(cleanText) || /Home\s*Design/i.test(cleanText)) {
      return "Home design & construction";
    }
    if (/Vastu\s*Consultation/i.test(cleanText) || /Vastu/i.test(cleanText)) {
      return "Vastu Consultation";
    }
    parent = parent.parentElement;
  }
  return null;
}

// Find appropriate native SVG string for image
function findSvgForImg(img) {
  if (!img || !img.src) return null;
  
  // 1. Match by card name in parent hierarchy (robust against URL updates)
  const cardName = getCardName(img);
  if (cardName && NAME_ICON_MAP[cardName]) {
    return NAME_ICON_MAP[cardName];
  }
  
  // 2. Match by URL fallback keys
  for (const [key, svgString] of Object.entries(URL_ICON_MAP)) {
    if (img.src.includes(key)) {
      return svgString;
    }
  }
  
  return null;
}

function initNativeIcons() {
  const checkAndReplace = (img) => {
    if (!img || !img.src) return;
    const svgString = findSvgForImg(img);
    if (svgString) {
      // Create the SVG element from string
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgString, 'image/svg+xml');
      const svg = doc.documentElement;
      
      // Copy critical layout attributes from img to svg
      if (img.id) svg.id = img.id;
      if (img.className) svg.setAttribute('class', img.className);
      
      const styleAttr = img.getAttribute('style');
      if (styleAttr) {
        svg.setAttribute('style', styleAttr);
      }
      
      // Replace the img tag with our inline SVG
      img.parentNode.replaceChild(svg, img);
    }
  };

  // Process existing images
  document.querySelectorAll('img').forEach(checkAndReplace);

  // Watch for dynamically added images (from React hydration)
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.tagName === 'IMG') {
          checkAndReplace(node);
        } else if (node.querySelectorAll) {
          node.querySelectorAll('img').forEach(checkAndReplace);
        }
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}
