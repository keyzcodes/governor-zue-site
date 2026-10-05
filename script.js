// script.js
(() => {
  "use strict";

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ============ 1. FOOTER YEAR ============ */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ============ 2. MOBILE MENU ============ */
// script.js
  /* ============ 2. MOBILE MENU (SIDE DRAWER) ============ */
  const navToggle = $("#navToggle");
  const navMenu = $("#navMenu");
  const navClose = $("#navClose");
  const navBackdrop = $("#navBackdrop");
  const desktopQuery = window.matchMedia("(min-width: 960px)");

  function setMenu(open) {
    if (!navToggle) return;
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.style.overflow = open ? "hidden" : "";
    if (open && navClose) {
      setTimeout(() => navClose.focus({ preventScroll: true }), 400);
    }
  }

  if (navToggle && navMenu) {
    navToggle.addEventListener("click", () => {
      setMenu(navToggle.getAttribute("aria-expanded") !== "true");
    });

    // Close button, backdrop tap, link tap, Escape
    if (navClose) {
      navClose.addEventListener("click", () => {
        setMenu(false);
        navToggle.focus({ preventScroll: true });
      });
    }
    if (navBackdrop) navBackdrop.addEventListener("click", () => setMenu(false));
    $$("a", navMenu).forEach((link) => {
      link.addEventListener("click", () => setMenu(false));
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setMenu(false);
    });

    // Swipe right on the drawer to close it
    let touchX = null;
    navMenu.addEventListener("touchstart", (e) => { touchX = e.touches[0].clientX; }, { passive: true });
    navMenu.addEventListener("touchend", (e) => {
      if (touchX !== null && e.changedTouches[0].clientX - touchX > 70) setMenu(false);
      touchX = null;
    }, { passive: true });

    // Reset when the viewport grows to desktop
    desktopQuery.addEventListener("change", (e) => {
      if (e.matches) setMenu(false);
    });
  }

  /* Highlight the link for the section currently on screen */
  const spyLinks = $$(".nav-links a");
  const spyTargets = spyLinks
    .map((a) => $(a.getAttribute("href")))
    .filter(Boolean);

  if ("IntersectionObserver" in window && spyTargets.length) {
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          spyLinks.forEach((a) => {
            a.classList.toggle("is-current", a.getAttribute("href") === "#" + entry.target.id);
          });
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    spyTargets.forEach((section) => spy.observe(section));
  }

  /* ============ 3. HERO VIDEO FALLBACK ============ */
  const heroVideo = $("#heroVideo");

  if (heroVideo) {
    // Skip the video if the placeholder ID was never replaced
    const hasRealId = !heroVideo.src.includes("YOUR_HERO_VIDEO_ID");
    const saveData = navigator.connection && navigator.connection.saveData;

    if (!hasRealId || saveData) {
      heroVideo.remove(); // fallback photo stays visible
    } else {
      heroVideo.addEventListener("load", () => {
        setTimeout(() => heroVideo.classList.add("is-ready"), 400);
      });
    }
  }

  /* ============ 4. SCROLL REVEAL (Intersection Observer) ============ */
  const revealEls = $$(".reveal");

  if ("IntersectionObserver" in window && revealEls.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Add .active when 20% is visible, remove it on exit so it resets
          entry.target.classList.toggle("active", entry.isIntersecting);
        });
      },
      {
        threshold: 0.2,
        rootMargin: "0px 0px 0px 0px",
      },
    );

    revealEls.forEach((el) => {
      // Hero is above the fold, so show it immediately
      if (el.id === "home") el.classList.add("active");
      observer.observe(el);
    });
  } else {
    // Old browsers: show everything
    revealEls.forEach((el) => el.classList.add("active"));
  }

    /* ============ 5. AUDIO PLAYER (YouTube-powered) ============ */
  const audioBar = $("#audioBar");
  const playBtn = $("#audioPlay");
  const switchBtn = $("#audioSwitch");
  const statusEl = $("#audioStatus");
  const titleEl = $("#audioTitle");

  // Add more tracks by pasting a YouTube video ID. The switch button appears at 2+ tracks.
  const tracks = [
    { title: "Faya", id: "guFNSQudTdM" },
    // { title: "Oh Maria", id: "PASTE_VIDEO_ID_HERE" },
  ];
  let current = 0;
  let player = null;
  let ready = false;

  function setPlayingUI(isPlaying) {
    if (!audioBar) return;
    audioBar.classList.toggle("is-playing", isPlaying);
    playBtn.setAttribute("aria-pressed", String(isPlaying));
    playBtn.setAttribute("aria-label", isPlaying ? "Pause music" : "Play music");
    statusEl.textContent = isPlaying ? "Now playing" : "Paused";
  }

  if (audioBar && playBtn) {
    if (switchBtn && tracks.length < 2) switchBtn.style.display = "none";
    titleEl.textContent = tracks[0].title;
    statusEl.textContent = "Loading...";

    // Load YouTube's player API
    const apiScript = document.createElement("script");
    apiScript.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(apiScript);

    window.onYouTubeIframeAPIReady = () => {
      player = new YT.Player("ytAudio", {
        width: "1",
        height: "1",
        videoId: tracks[0].id,
        playerVars: { playsinline: 1, controls: 0, rel: 0, disablekb: 1 },
        events: {
          onReady: () => {
            ready = true;
            statusEl.textContent = "Tap to play";
          },
          onStateChange: (e) => {
            if (e.data === YT.PlayerState.PLAYING) setPlayingUI(true);
            else if (e.data === YT.PlayerState.PAUSED) setPlayingUI(false);
            else if (e.data === YT.PlayerState.ENDED) player.playVideo(); // loop
          },
          onError: () => {
            setPlayingUI(false);
            statusEl.textContent = "Can't play here";
          },
        },
      });
    };

    // Must run inside the tap so mobile browsers allow sound
    playBtn.addEventListener("click", () => {
      if (!ready) return;
      if (player.getPlayerState() === YT.PlayerState.PLAYING) player.pauseVideo();
      else player.playVideo();
    });

    if (switchBtn) {
      switchBtn.addEventListener("click", () => {
        if (!ready || tracks.length < 2) return;
        current = (current + 1) % tracks.length;
        titleEl.textContent = tracks[current].title;
        player.loadVideoById(tracks[current].id); // starts playing right away
      });
    }

    // Pause when the tab is hidden
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && ready) player.pauseVideo();
    });
  }
  /* ============ 6. FORMS ============ */
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function showError(field, message) {
    field.classList.add("has-error");
    const msg = $(".error-msg", field);
    if (msg) msg.textContent = message;
  }

  function clearError(field) {
    field.classList.remove("has-error");
    const msg = $(".error-msg", field);
    if (msg) msg.textContent = "";
  }

  function validateField(input) {
    const field = input.closest(".field");
    if (!field) return true;

    const value = input.value.trim();

    if (input.required && !value) {
      showError(field, "This field is required.");
      return false;
    }
    if (input.type === "email" && value && !emailPattern.test(value)) {
      showError(field, "Enter a valid email address.");
      return false;
    }
    if (input.name === "message" && value && value.length < 10) {
      showError(field, "Please add a few more details.");
      return false;
    }

    clearError(field);
    return true;
  }

  function setStatus(el, message, type) {
    el.textContent = message;
    el.classList.remove("is-success", "is-error");
    if (type) el.classList.add(type === "success" ? "is-success" : "is-error");
  }

  function setupForm(form, statusEl, successMessage, onValid) {
    if (!form) return;

    const inputs = $$("input, select, textarea", form);

    // Validate on blur, and clear errors as the user fixes them
    inputs.forEach((input) => {
      input.addEventListener("blur", () => {
        if (input.required || input.value.trim()) validateField(input);
      });
      input.addEventListener("input", () => {
        const field = input.closest(".field");
        if (field && field.classList.contains("has-error"))
          validateField(input);
      });
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      setStatus(statusEl, "", null);

      const results = inputs.map(validateField);
      if (results.includes(false)) {
        setStatus(statusEl, "Please fix the highlighted fields.", "error");
        const firstBad = inputs.find((i) =>
          i.closest(".field")?.classList.contains("has-error"),
        );
        if (firstBad) firstBad.focus();
        return;
      }

      const submitBtn = $('button[type="submit"]', form);
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending...";

      try {
        await onValid(Object.fromEntries(new FormData(form).entries()));
        setStatus(statusEl, successMessage, "success");
        form.reset();
      } catch (err) {
        console.error(err);
        setStatus(statusEl, "Something went wrong. Please try again.", "error");
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }

  /*
    Replace this function with a real backend call.
    Easy options: Formspree, Getform, Netlify Forms, or your own API.
    Example:
      const res = await fetch("https://formspree.io/f/YOUR_ID", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Request failed");
  */
  function submitToBackend(data) {
    return new Promise((resolve) => {
      console.log("Form data ready to send:", data);
      setTimeout(resolve, 900); // simulated network delay
    });
  }

  setupForm(
    $("#bookingForm"),
    $("#bookingStatus"),
    "Inquiry sent. The team will reply by email soon.",
    submitToBackend,
  );

  setupForm(
    $("#fanForm"),
    $("#fanStatus"),
    "You're in. Watch your inbox for new drops.",
    submitToBackend,
  );

  // Block past dates in the event date picker
  const dateInput = $("#bk-date");
  if (dateInput) {
    dateInput.min = new Date().toISOString().split("T")[0];
  }
})();
