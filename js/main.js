// Reidius Infra - Main Script

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initScrollAnimations();
  initStatsCounter();
  initCursorGlow();
  initTestimonials();
  initDownloadPortfolio();
  initLazyLoading();
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
  const pdfUrl = 'assets/RI-Portfolio.pdf';

  function triggerDownload() {
    const a = document.createElement('a');
    a.href = pdfUrl;
    // No target="_blank" — browsers ignore `download` when target is _blank
    a.download = 'RI-Portfolio.pdf';
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
    if (img && !img.hasAttribute('loading')) {
      img.setAttribute('loading', 'lazy');
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
