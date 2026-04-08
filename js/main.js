/* ==========================================================================
   N.S. Stone — interaction layer
   Navigation, scroll reveals, hero flower progress, video autoplay, and
   page progress updates.
   ========================================================================== */

(() => {
  const root = document.documentElement;
  const body = document.body;
  const navToggle = document.querySelector(".nav-toggle");
  const siteNav = document.querySelector(".site-nav");
  const progressFill = document.querySelector(".progress-bar__fill");
  const heroSection = document.querySelector("[data-hero]");
  const heroFlowerGroup = document.querySelector("#hero-flower-group");
  const heroVideo = document.querySelector(".hero__video");
  const revealTargets = document.querySelectorAll("[data-reveal]");
  const parallaxTargets = document.querySelectorAll("[data-speed]");
  const autoplayVideos = document.querySelectorAll("video[data-autoplay-when-visible], .hero__video");

  root.classList.add("js");

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const easeOutQuint = (value) => 1 - Math.pow(1 - value, 5);

  if (navToggle && siteNav) {
    const navLinks = siteNav.querySelectorAll("a");

    const closeNav = () => {
      navToggle.setAttribute("aria-expanded", "false");
      body.classList.remove("nav-open");
    };

    navToggle.addEventListener("click", () => {
      const expanded = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.setAttribute("aria-expanded", String(!expanded));
      body.classList.toggle("nav-open", !expanded);
    });

    navLinks.forEach((link) => {
      link.addEventListener("click", closeNav);
    });

    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeNav();
      }
    });

    document.addEventListener("click", (event) => {
      if (!body.classList.contains("nav-open")) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (siteNav.contains(target) || navToggle.contains(target)) return;
      closeNav();
    });
  }

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.14,
      rootMargin: "0px 0px -8% 0px",
    }
  );

  revealTargets.forEach((target) => revealObserver.observe(target));

  if (autoplayVideos.length > 0) {
    const videoObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target;
          if (!(video instanceof HTMLVideoElement)) return;

          video.muted = true;
          video.playsInline = true;
          video.loop = true;
          video.preload = "metadata";

          if (entry.isIntersecting) {
            const playPromise = video.play();
            if (playPromise && typeof playPromise.catch === "function") {
              playPromise.catch(() => {});
            }
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.34 }
    );

    autoplayVideos.forEach((video) => videoObserver.observe(video));
  }

  function updatePageProgress() {
    if (!progressFill) return;
    const scrollTop = window.scrollY || window.pageYOffset || 0;
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? clamp(scrollTop / scrollable, 0, 1) : 0;
    progressFill.style.width = `${(progress * 100).toFixed(2)}%`;
  }

  function updateHeroProgress() {
    if (!heroSection) return;

    const rect = heroSection.getBoundingClientRect();
    const total = Math.max(heroSection.offsetHeight - window.innerHeight, 1);
    const rawProgress = clamp(-rect.top / total, 0, 1);
    const revealProgress = clamp((rawProgress - 0.02) / 0.97, 0, 1);
    const eased = revealProgress * revealProgress * (3 - 2 * revealProgress);

    // Slow the reveal slightly at the start, then let it ease out smoothly.
    const scale = 0.58 + eased * 4.52;
    const c = 500;
    const transform = `translate(${c} ${c}) scale(${scale.toFixed(4)}) translate(-${c} -${c})`;

    root.style.setProperty("--hero-progress", rawProgress.toFixed(4));
    root.style.setProperty("--hero-reveal-scale", scale.toFixed(4));
    root.style.setProperty("--hero-veil-opacity", (0.985 - revealProgress * 0.2).toFixed(4));

    if (heroFlowerGroup) {
      heroFlowerGroup.setAttribute("transform", transform);
    }
  }

  function updateParallax() {
    if (!parallaxTargets.length) return;
    parallaxTargets.forEach((target) => {
      const speed = Number(target.getAttribute("data-speed")) || 0;
      const rect = target.getBoundingClientRect();
      const offset = (window.innerHeight * 0.5 - rect.top) * speed;
      target.style.setProperty("--parallax-offset", `${offset.toFixed(1)}px`);
    });
  }

  function updateOnScroll() {
    updatePageProgress();
    updateHeroProgress();
    updateParallax();
  }

  let ticking = false;
  function requestUpdate() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      updateOnScroll();
      ticking = false;
    });
  }

  updateOnScroll();
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);

  document.querySelectorAll("[data-current-year]").forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });

  if (heroVideo) {
    heroVideo.addEventListener("error", () => {
      heroVideo.setAttribute("poster", "assets/img/umaid-bhawan.jpg");
    });
  }
})();


const galleryToggle = document.querySelector('[data-gallery-toggle]');
const galleryPanel = document.querySelector('#media-gallery');

if (galleryToggle && galleryPanel) {
  const syncGalleryState = (isOpen) => {
    galleryToggle.setAttribute('aria-expanded', String(isOpen));
    galleryPanel.setAttribute('aria-hidden', String(!isOpen));
    galleryToggle.textContent = isOpen ? 'Hide visuals' : 'Open gallery';
  };

  syncGalleryState(false);

  galleryToggle.addEventListener('click', () => {
    const isOpen = galleryPanel.classList.toggle('is-open');
    syncGalleryState(isOpen);

    if (isOpen) {
      window.setTimeout(() => {
        galleryPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
    }
  });
}
