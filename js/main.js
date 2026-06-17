// Reidius Infra - Main Script

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initScrollAnimations();
  initStatsCounter();
  initCursorGlow();
  initTestimonials();
  initDownloadPortfolio();
  initCardIcons();
  initLazyLoading();
  initBgLazyLoading();
  initVideoAudio();
  initEstimationRedirect();
  initAddressPatch();
  initOfficeHoursPatch();
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
  // Resolve PDF path dynamically based on path depth (to support subdirectories like /blog/)
  const pathParts = window.location.pathname.split('/');
  const depth = pathParts.length - 2;
  const prefix = depth > 0 ? '../'.repeat(depth) : '';
  const pdfUrl = prefix + 'assets/ReidiusInfra_Portfoliio.pdf?v=' + Date.now();

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
    // 1. Selector fallback targeting Framer classes
    const selectors = ['.framer-86meoo-container', '.framer-1d4usz9', '.framer-i0pmw1'];
    selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(btn => {
        if (btn._dpFixed) return;
        btn._dpFixed = true;
        
        btn.style.cursor = 'pointer';
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          triggerDownload();
        });
      });
    });

    // 2. Keyword/Content search fallback
    document.querySelectorAll('button, a, [role="button"]').forEach(btn => {
      if (btn._dpFixed) return;
      
      const text = btn.textContent ? btn.textContent.toLowerCase().replace(/\s+/g, '') : '';
      if (text.indexOf('download') !== -1) {
        btn._dpFixed = true;
        btn.style.cursor = 'pointer';
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          triggerDownload();
        });
      }
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

// Dynamically replace broken service card icons with inline base64 SVGs
function initCardIcons() {
  const sofaSvg = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMxYzFiMWYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMjAgOVY2YTIgMiAwIDAgMC0yLTJINmEyIDIgMCAwIDAtMiAydjMiLz48cGF0aCBkPSJNMiAxNmEyIDIgMCAwIDAgMiAyaDE2YTIgMiAwIDAgMCAyLTJ2LTVhMiAyIDAgMCAwLTItMkg0YTIgMiAwIDAgMC0yIDJaIi8+PHBhdGggZD0iTTQgMTh2MiIvPjxwYXRoIGQ9Ik0yMCAxOHYyIi8+PHBhdGggZD0iTTEyIDR2OSIvPjwvc3ZnPg==';
  const houseSvg = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMxYzFiMWYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJtMyA5IDktNyA5IDd2MTFhMiAyIDAgMCAxLTIgMkg1YTIgMiAwIDAgMS0yLTJ6Ii8+PHBvbHlsaW5lIHBvaW50cz0iOSAyMiA5IDEyIDE1IDEyIDE1IDIyIi8+PC9zdmc+';
  const hammerSvg = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMxYzFiMWYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJtMTUgMTUtOC41IDguNWEyLjEyIDIuMTIgMCAxIDEtMy0zTDEyIDkiLz48cGF0aCBkPSJNMTcuNjQgMTUgMjIgMTAuNjQiLz48cGF0aCBkPSJtMjAuOTEgMTEuNy0xLjI1LTEuMjVhNCA0IDAgMSAxIDUuNjYtNS42NmwxLjI1IDEuMjVhMiAyIDAgMCAxIDAgMi44M2wtMi44MyAyLjgzYTIgMiAwIDAgMS0yLjgzIDBaIi8+PHBhdGggZD0ibTE0IDEzIDUgNSIvPjwvc3ZnPg==';
  const buildingSvg = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMxYzFiMWYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMiAyMmgyMCIvPjxwYXRoIGQ9Ik0yMCAyMlY0YTIgMiAwIDAgMC0yLTJINmEyIDIgMCAwIDAtMiAydjE4Ii8+PHBhdGggZD0iTTkgMjJWMTZoNnY2Ii8+PHBhdGggZD0iTTggNmgyIi8+PHBhdGggZD0iTTE0IDZoMiIvPjxwYXRoIGQ9Ik04IDEwaDIiLz48cGF0aCBkPSJNMTQgMTBoMiIvPjxwYXRoIGQ9Ik0gOCAxNGgyIi8+PHBhdGggZD0iTTE0IDE0aDIiLz48L3N2Zz4=';

  const fileMap = {
    'vZkkLuRJkp37uvzRJHx9MCXQU': sofaSvg,
    'ATELiCCX2Dk8hJ4XDcKfq9fT4c': houseSvg,
    'hZverpXkvx0VBcNmVFct8kD1COU': hammerSvg,
    'S2H55LFeD7gQiWbMZCLCBSC2U': buildingSvg
  };

  const textKeywords = [
    { keywords: ['interior design'], svg: sofaSvg },
    { keywords: ['home design', 'residence'], svg: houseSvg },
    { keywords: ['construction &', 'construction and'], svg: hammerSvg },
    { keywords: ['commercial'], svg: buildingSvg }
  ];

  function replaceIcon(img, svgData) {
    if (img.src !== svgData) {
      img.src = svgData;
      img.style.filter = 'none';
      img.style.webkitFilter = 'none';
      img.style.opacity = '1';
      img.style.objectFit = 'contain';
    }
  }

  function checkAndReplace() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      const src = img.src || '';
      
      // 1. Match by specific deleted Firebase filenames
      for (const [filename, svgData] of Object.entries(fileMap)) {
        if (src.indexOf(filename) !== -1) {
          replaceIcon(img, svgData);
          return;
        }
      }

      // 2. Fallback: match by card text content in parent containers
      let parent = img.parentElement;
      let depth = 0;
      while (parent && depth < 4) {
        const text = parent.textContent ? parent.textContent.toLowerCase() : '';
        if (text) {
          for (const item of textKeywords) {
            const matchesKeyword = item.keywords.some(kw => text.indexOf(kw) !== -1);
            if (matchesKeyword) {
              const isSmall = img.naturalWidth < 100 || img.naturalHeight < 100 || 
                              (img.style.width && parseInt(img.style.width) < 100) ||
                              (img.offsetWidth && img.offsetWidth < 100) ||
                              src.endsWith('.svg') || src.includes('.svg?');
              
              if (isSmall && !src.includes('.webp') && !src.includes('.jpg') && !src.includes('.png')) {
                replaceIcon(img, item.svg);
                return;
              }
            }
          }
        }
        parent = parent.parentElement;
        depth++;
      }
    });
  }

  // Run immediately
  checkAndReplace();

  // Run on layout shifts / lazy loading / dynamic rendering
  const observer = new MutationObserver(checkAndReplace);
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });
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

// Global video unmute handler to resolve Framer autoplay/react-muted bugs on user interaction
function initVideoAudio() {
  try {
    const originalMutedDescriptor = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'muted');
    if (originalMutedDescriptor) {
      Object.defineProperty(HTMLMediaElement.prototype, 'muted', {
        get: function() {
          if (this._userUnmuted) return false;
          return originalMutedDescriptor.get.call(this);
        },
        set: function(value) {
          if (this._userUnmuted) {
            originalMutedDescriptor.set.call(this, false);
            this.removeAttribute('muted');
            return;
          }
          originalMutedDescriptor.set.call(this, value);
        },
        configurable: true
      });
    }
  } catch (e) {
    console.warn('Failed to override HTMLMediaElement.prototype.muted:', e);
  }

  const unmute = (video) => {
    if (!video) return;
    video._userUnmuted = true;
    video.muted = false;
    video.removeAttribute('muted');
    if (video.volume === 0 || video.volume === 0.25) {
      video.volume = 1.0;
    }
  };

  const handleInteraction = (e) => {
    let video = e.target.closest('video');
    if (!video) {
      let current = e.target;
      let depth = 0;
      while (current && current !== document.body && depth < 4) {
        const videos = current.querySelectorAll('video');
        if (videos.length === 1) {
          video = videos[0];
          break;
        } else if (videos.length > 1) {
          break;
        }
        current = current.parentElement;
        depth++;
      }
    }
    if (video) {
      unmute(video);
      if (e.type === 'click') {
        e.preventDefault();
        e.stopPropagation();
        if (video.paused) {
          video.play().catch(err => console.log('Play failed:', err));
        } else {
          video.pause();
        }
      }
    }
  };

  document.addEventListener('click', handleInteraction, true);
  document.addEventListener('touchstart', handleInteraction, { capture: true, passive: true });

  setInterval(() => {
    document.querySelectorAll('video').forEach(video => {
      if (video._userUnmuted && (video.muted || video.hasAttribute('muted'))) {
        unmute(video);
      }
    });
  }, 1000);
}

// Redirect "Get free Estimation of your house" button to the calculator website
function initEstimationRedirect() {
  const targetUrl = 'https://calculator.reidiusinfra.in/';

  function wire() {
    const selectors = [
      '[data-framer-name="Get free Estimation of your house"]',
      '[data-framer-name="Get Free Estimation"]',
      '.framer-1736doq',
      '.framer-3nvv4t',
      '.framer-sym3iz'
    ];
    
    selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(btn => {
        if (btn._estFixed) return;
        btn._estFixed = true;
        btn.style.cursor = 'pointer';
        
        const link = btn.closest('a');
        if (link) {
          link.href = targetUrl;
          link.target = '_blank';
          link.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            window.open(targetUrl, '_blank');
          });
        } else {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            window.open(targetUrl, '_blank');
          });
        }
      });
    });

    document.querySelectorAll('button, a, [role="button"], p, span, div').forEach(el => {
      if (el._estFixed) return;
      
      const text = el.textContent ? el.textContent.trim().toLowerCase() : '';
      if (
        text === 'get free estimation of your house' || 
        text === 'get free estimation' ||
        text === 'calculate cost now'
      ) {
        el._estFixed = true;
        el.style.cursor = 'pointer';
        
        const link = el.closest('a');
        if (link) {
          link.href = targetUrl;
          link.target = '_blank';
          link.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            window.open(targetUrl, '_blank');
          });
        } else {
          el.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            window.open(targetUrl, '_blank');
          });
        }
      }
    });
  }

  wire();
  
  const observer = new MutationObserver(wire);
  observer.observe(document.body, { childList: true, subtree: true });
  setTimeout(() => observer.disconnect(), 10000);
}

// Dynamically patch all instances of the old office address with the new office address
function initAddressPatch() {
  const newAddress = "6D Engineer's Colony, D-64, New Sanganer Rd, Manyawas, Mohru Nagar, Mansarovar, Jaipur, Rajasthan 302020";
  const newGmapUrl = "https://www.google.com/maps/place/Reidius+Infra+Construction+Company+In+Jaipur/@26.8715354,75.7322332,17z/data=!3m1!4b1!4m6!3m5!1s0x396db59f5d222b19:0x4d8a65a331b42fed!8m2!3d26.8715354!4d75.7348081!16s%2Fg%2F11sbv8bc22";
  const oldAddrParts = ["Nand Vihar", "68 A", "Vaishali Nagar", "Amarpali Marg", "Amrapali Marg"];

  function patch() {
    // 1. Walk text nodes and replace old address
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    let node;
    while (node = walker.nextNode()) {
      const txt = node.nodeValue || '';
      if (oldAddrParts.some(part => txt.indexOf(part) !== -1)) {
        if (txt.indexOf("Reidius Infra Pvt. Ltd.") !== -1) {
          node.nodeValue = "Reidius Infra Pvt. Ltd., " + newAddress;
        } else if (txt.trim().length > 10) {
          node.nodeValue = newAddress;
        }
      }
    }

    // 2. Patch Google Maps links
    document.querySelectorAll('a[href*="maps.google"], a[href*="goo.gl/maps"], a[href*="maps.app.goo"], a[href*="google.com/maps"]').forEach(a => {
      if (a.href !== newGmapUrl) {
        a.href = newGmapUrl;
        a.target = "_blank";
      }
    });

    // 3. Patch Gmap / Open in buttons
    document.querySelectorAll('a, button, [role="button"]').forEach(el => {
      const text = el.textContent ? el.textContent.trim().toLowerCase() : '';
      if (text.indexOf('gmap') !== -1 || text.indexOf('open in') !== -1) {
        if (el.tagName === 'A') {
          el.href = newGmapUrl;
          el.target = "_blank";
        }
      }
    });

    // 4. Intercept the Copy Address component and force it to copy the new address
    document.querySelectorAll('button, a, [role="button"], div').forEach(el => {
      const labelAttr = el.getAttribute('label') || '';
      const text = el.textContent ? el.textContent.trim() : '';
      const dataName = el.getAttribute('data-framer-name') || '';
      
      if (
        text.toLowerCase() === 'copy address' || 
        labelAttr.toLowerCase() === 'copy address' || 
        dataName.toLowerCase() === 'copy address' ||
        (el.className && el.className.indexOf('copy-address') !== -1)
      ) {
        if (!el._copyAddrIntercepted) {
          el._copyAddrIntercepted = true;
          el.style.cursor = 'pointer';
          el.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            navigator.clipboard.writeText("Reidius Infra Pvt. Ltd., " + newAddress)
              .then(() => {
                let targetTextEl = el.querySelector('p, span') || el;
                const originalText = targetTextEl.textContent;
                targetTextEl.textContent = 'Copied!';
                setTimeout(() => { targetTextEl.textContent = originalText; }, 2000);
              })
              .catch(err => {
                console.error('Failed to copy new address:', err);
              });
          }, true);
        }
      }
    });
  }

  patch();
  const observer = new MutationObserver(patch);
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
}

// Dynamically patch Sunday office hours from "Closed" to the same timing as other days
function initOfficeHoursPatch() {
  function patch() {
    // 1. Walk text nodes and replace "Closed" with "10:30 am - 7:00 pm"
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    let node;
    while (node = walker.nextNode()) {
      const txt = node.nodeValue || '';
      if (txt.trim() === 'Closed') {
        node.nodeValue = '10:30 am - 7:00 pm';
        if (node.parentElement) {
          node.parentElement.style.color = 'rgb(208, 208, 208)';
          node.parentElement.style.setProperty('--framer-text-color', 'rgb(208, 208, 208)');
        }
      }
    }

    // 2. Also patch data-framer-name attributes if they are "Closed"
    document.querySelectorAll('[data-framer-name="Closed"]').forEach(el => {
      el.setAttribute('data-framer-name', '10:30 am - 7:00 pm');
      if (el.textContent && el.textContent.trim() === 'Closed') {
        el.textContent = '10:30 am - 7:00 pm';
      }
    });
  }

  patch();
  const observer = new MutationObserver(patch);
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
}

