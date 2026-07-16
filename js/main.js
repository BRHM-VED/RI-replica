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
  initTopBarPatch();
  initEmployeePatch();
  initProjectPatch();
  initImagePreloader();
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
    const isMobile = window.innerWidth < 810 || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    
    if (isMobile) {
      fetch(pdfUrl, { cache: 'no-store' })
        .then(response => response.blob())
        .then(blob => {
          const blobUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = 'ReidiusInfra_Portfoliio.pdf';
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);
          }, 100);
        })
        .catch(() => {
          // Fallback if fetch fails
          const a = document.createElement('a');
          a.href = pdfUrl;
          a.download = 'ReidiusInfra_Portfoliio.pdf';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        });
    } else {
      // On desktop: show/open the PDF in a new tab
      window.open(pdfUrl, '_blank');
    }
  }

  // Combined capture-phase listener for delegated portfolio downloads and reliable navigation
  document.addEventListener('click', (e) => {
    // Safety check: if clicking on or inside a menu toggle, hamburger, or close button, ignore it completely
    if (e.target && typeof e.target.closest === 'function') {
      if (e.target.closest('.hamburger') || e.target.closest('[data-framer-name="menu"]') || e.target.closest('[data-framer-name="close"]')) {
        return;
      }
    }

    // 1. Delegated Portfolio Download
    let target = e.target;
    let loopDepth = 0;
    // Limit parent traversal to 4 levels to prevent bubbling up to header container variants named "Portfolio"
    while (target && target !== document.body && loopDepth < 4) {
      if (target.nodeType === 1) { // Ensure it is an Element node
        const framerName = target.getAttribute('data-framer-name');
        const isSelectorMatch = typeof target.matches === 'function' && (
          target.matches('.framer-86meoo-container') || 
          target.matches('.framer-1d4usz9') || 
          target.matches('.framer-i0pmw1') ||
          framerName === 'Download Portfolio' ||
          framerName === 'Portfolio'
        );
        
        const text = target.textContent ? target.textContent.toLowerCase().replace(/\s+/g, '') : '';
        const isKeywordMatch = text.length < 30 && (
          text.indexOf('downloadportfolio') !== -1 || 
          text === 'portfolio'
        );

        if (isSelectorMatch || isKeywordMatch) {
          // Explicit safety guard: do not trigger download for menu toggles, close buttons, or navigation wrappers
          if (text.indexOf('menu') !== -1 || text.indexOf('close') !== -1 || target.closest('.hamburger')) {
            target = target.parentElement;
            loopDepth++;
            continue;
          }
          e.preventDefault();
          e.stopPropagation();
          triggerDownload();
          return;
        }
      }
      target = target.parentElement;
      loopDepth++;
    }

    // 2. Global Link Navigation fix (specifically inside mobile drawer or dynamic layouts to bypass Framer preventDefault)
    const anchor = e.target && typeof e.target.closest === 'function' ? e.target.closest('a') : null;
    if (anchor) {
      const href = anchor.getAttribute('href');
      if (href) {
        const isLocal = !/^(https?:|\/\/)/i.test(href) || href.includes(window.location.host);
        if (isLocal && !href.startsWith('#') && !href.startsWith('tel:') && !href.startsWith('mailto:')) {
          e.preventDefault();
          e.stopPropagation();
          window.location.href = href;
        }
      }
    }
  }, true); // capture phase ensures we run before Framer's default-blocking listeners
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

// Global loader to force eager-loading for dynamically injected image tags
function initLazyLoading() {
  const setEager = (img) => {
    if (!img) return;
    img.setAttribute('loading', 'eager');
    img.setAttribute('fetchpriority', 'high');
  };

  // Watch for any images added dynamically by React/Framer
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.tagName === 'IMG') {
          setEager(node);
        } else if (node.querySelectorAll) {
          node.querySelectorAll('img').forEach(setEager);
        }
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Apply eager loading to any images currently on the page
  document.querySelectorAll('img').forEach(setEager);
}

// Global loader to force immediate background image loading
function initBgLazyLoading() {
  const loadBg = (el) => {
    if (!el) return;
    const bgUrl = el.getAttribute('data-bg');
    if (bgUrl) {
      el.style.backgroundImage = `url('${bgUrl}')`;
    }
    el.classList.add('bg-loaded');
  };

  // Watch for any dynamically injected background elements
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          if (node.classList.contains('lazy-bg') || node.hasAttribute('data-bg')) {
            loadBg(node);
          }
          node.querySelectorAll('.lazy-bg, [data-bg]').forEach(loadBg);
        }
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Load all background elements currently on the page immediately
  document.querySelectorAll('.lazy-bg, [data-bg]').forEach(loadBg);
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

// Dynamically patch the mobile scrolling top-bar ticker to show only fixed Contact details
function initTopBarPatch() {
  function patch() {
    const containers = document.querySelectorAll('.framer-hiyc77-container');
    containers.forEach(container => {
      if (container._tbPatched) return;
      container._tbPatched = true;

      container.innerHTML = `
        <div style="width: 100%; height: 100%; position: relative;">
          <div class="framer-vkebyu" data-framer-name="Contact: +91 9057344344" data-framer-component-type="RichTextContainer" style="--extracted-r6o4lv:rgb(129, 129, 129);--framer-paragraph-spacing:0px;position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);">
            <p class="framer-text" style="--font-selector:R0Y7QXJjaGl2by1yZWd1bGFy;--framer-font-family:&quot;Archivo&quot;, &quot;Archivo Placeholder&quot;, sans-serif;--framer-font-size:12px;--framer-line-height:121%;--framer-text-color:var(--extracted-r6o4lv, rgb(129, 129, 129));white-space:nowrap;margin:0;">
              Contact: +91 9057344344
            </p>
          </div>
        </div>
      `;
    });
  }

  patch();
  const observer = new MutationObserver(patch);
  observer.observe(document.body, { childList: true, subtree: true });
}

// Dynamically remove specific employee profiles from the About page
function initEmployeePatch() {
  const namesToRemove = [
    "Ar. Vartika Agarwal",
    "Kaushal Kumawat",
    "Mukesh Kumawat",
    "Manish Kumar Kumawat",
    "Shlok Saini",
    "Hemanth Kumawat",
    "Shahid Khan",
    "Omprakash",
    "Tejwant Kumar",
    "Nikita Joshi"
  ];

  function patch() {
    const textElements = document.querySelectorAll('p, span, div');
    textElements.forEach(el => {
      if (el.children.length > 0) return;
      const text = el.textContent ? el.textContent.trim() : '';
      if (!text) return;

      const matches = namesToRemove.some(name => {
        const cleanText = text.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
        const cleanName = name.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
        return cleanText === cleanName;
      });

      if (matches) {
        let parent = el;
        let depth = 0;
        let cardFound = false;

        while (parent && depth < 6) {
          parent = parent.parentElement;
          if (!parent || parent === document.body) break;
          
          const framerName = parent.getAttribute('data-framer-name') || '';
          if (
            framerName.indexOf('Frame 328') !== -1 ||
            framerName.indexOf('Variant') !== -1 ||
            (parent.querySelector('img') && parent.parentElement && parent.parentElement.children.length > 2)
          ) {
            parent.style.display = 'none';
            cardFound = true;
            break;
          }
          depth++;
        }

        if (!cardFound && el.parentElement) {
          let fallback = el.parentElement;
          while (fallback && fallback.parentElement && fallback.parentElement !== document.body) {
            if (fallback.querySelector('img')) {
              fallback.style.display = 'none';
              break;
            }
            fallback = fallback.parentElement;
          }
        }
      }
    });
  }

  patch();
  const observer = new MutationObserver(patch);
  observer.observe(document.body, { childList: true, subtree: true });
}

// Dynamically remove specific projects from pages at runtime
function initProjectPatch() {
  const projectsToRemove = [
    "Rajesh Kumar"
  ];

  function patch() {
    const textElements = document.querySelectorAll('p, span, div');
    textElements.forEach(el => {
      if (el.children.length > 0) return;
      const text = el.textContent ? el.textContent.trim() : '';
      if (!text) return;

      const matches = projectsToRemove.some(proj => {
        return text.toLowerCase() === proj.toLowerCase();
      });

      if (matches) {
        let parent = el;
        let depth = 0;
        let cardFound = false;

        while (parent && depth < 6) {
          parent = parent.parentElement;
          if (!parent || parent === document.body) break;
          
          const classes = Array.from(parent.classList);
          const isFramer = classes.some(c => c.startsWith('framer-'));
          const hasImg = parent.querySelector('img') !== null;
          
          if (isFramer && hasImg) {
            parent.style.display = 'none';
            cardFound = true;
            break;
          }
          depth++;
        }
      }
    });
  }

  patch();
  const observer = new MutationObserver(patch);
  observer.observe(document.body, { childList: true, subtree: true });
}

// Preloader to eager-fetch and cache all images in the background on startup
function initImagePreloader() {
  const preloadedUrls = new Set();
  
  const preloadImg = (src) => {
    if (!src || preloadedUrls.has(src)) return;
    preloadedUrls.add(src);
    const tempImg = new Image();
    tempImg.src = src;
  };

  const scanAndPreload = () => {
    // 1. Scan image tags
    document.querySelectorAll('img').forEach(img => {
      const src = img.getAttribute('src');
      if (src) preloadImg(src);
      
      const srcset = img.getAttribute('srcset');
      if (srcset) {
        srcset.split(',').forEach(part => {
          const url = part.trim().split(/\s+/)[0];
          if (url) preloadImg(url);
        });
      }
    });

    // 2. Scan elements with custom data-bg or style backgrounds
    document.querySelectorAll('[data-bg]').forEach(el => {
      const bg = el.getAttribute('data-bg');
      if (bg) preloadImg(bg);
    });
  };

  // Run initial scan
  scanAndPreload();

  // Watch for any dynamically added content and prefetch new images immediately
  const observer = new MutationObserver((mutations) => {
    scanAndPreload();
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

