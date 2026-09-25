(function () {
  "use strict";

  var TELEGRAM_USERNAME = "binailah"; // change this to update the Telegram handle everywhere

  /* ---------------------------------------------------------
     Mobile navigation
  --------------------------------------------------------- */
  var navToggle = document.getElementById("nav-toggle");
  var mobileNav = document.getElementById("mobile-nav");

  function closeMobileNav() {
    mobileNav.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Открыть меню");
  }

  function toggleMobileNav() {
    var isOpen = mobileNav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    navToggle.setAttribute("aria-label", isOpen ? "Закрыть меню" : "Открыть меню");
  }

  if (navToggle && mobileNav) {
    navToggle.addEventListener("click", toggleMobileNav);
    mobileNav.querySelectorAll("a, button").forEach(function (el) {
      el.addEventListener("click", closeMobileNav);
    });
  }

  /* ---------------------------------------------------------
     Scroll reveal — one quiet pass, respects reduced motion
  --------------------------------------------------------- */
  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var revealTargets = document.querySelectorAll(
    ".hero-inner, .problem-inner, .about-inner, .offer-inner, .credentials-inner, " +
    ".testimonials-inner, .format-inner, .pricing-inner, .trial-inner, .final-cta-inner"
  );

  if (!prefersReducedMotion && "IntersectionObserver" in window) {
    revealTargets.forEach(function (el) { el.classList.add("reveal"); });

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );

    revealTargets.forEach(function (el) { io.observe(el); });
  }

  /* ---------------------------------------------------------
     Lead capture modal — mini qualification funnel
  --------------------------------------------------------- */
  var overlay = document.getElementById("modal-overlay");
  var modal = document.getElementById("modal");
  var closeBtn = document.getElementById("modal-close");
  var telegramLink = document.getElementById("telegram-link");

  var state = {
    subject: null,   // "english" | "arabic"
    need: null,      // english: ОГЭ / ЕГЭ / Разговорный / Другое
    base: null,      // arabic: base level
    detail: ""        // free-text about / goal
  };

  var lastFocused = null;

  function getStepEl(step) {
    return modal.querySelector('.modal-step[data-step="' + step + '"]');
  }

  function showStep(step) {
    modal.querySelectorAll(".modal-step").forEach(function (el) {
      el.hidden = true;
    });
    var target = getStepEl(step);
    if (target) {
      target.hidden = false;
      var firstFocusable = target.querySelector("button, textarea, input, a");
      if (firstFocusable) firstFocusable.focus();
    }
  }

  function resetState() {
    state = { subject: null, need: null, base: null, detail: "" };
    var englishTextarea = document.getElementById("english-about");
    var arabicTextarea = document.getElementById("arabic-goal");
    if (englishTextarea) englishTextarea.value = "";
    if (arabicTextarea) arabicTextarea.value = "";
  }

  function openModal() {
    lastFocused = document.activeElement;
    resetState();
    showStep("1");
    overlay.hidden = false;
    requestAnimationFrame(function () {
      overlay.classList.add("is-open");
    });
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    overlay.classList.remove("is-open");
    document.body.style.overflow = "";
    window.setTimeout(function () {
      overlay.hidden = true;
    }, prefersReducedMotion ? 0 : 320);
    if (lastFocused && typeof lastFocused.focus === "function") {
      lastFocused.focus();
    }
  }

  document.querySelectorAll(".js-open-modal").forEach(function (btn) {
    btn.addEventListener("click", openModal);
  });

  closeBtn.addEventListener("click", closeModal);

  overlay.addEventListener("click", function (e) {
    if (e.target === overlay) closeModal();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !overlay.hidden) {
      closeModal();
    }
  });

  // Focus trap within modal
  modal.addEventListener("keydown", function (e) {
    if (e.key !== "Tab") return;
    var focusable = modal.querySelectorAll(
      'button:not([hidden]):not([disabled]), textarea:not([hidden]), a[href]:not([hidden])'
    );
    var visible = Array.prototype.filter.call(focusable, function (el) {
      return el.offsetParent !== null;
    });
    if (!visible.length) return;
    var first = visible[0];
    var last = visible[visible.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  // Step 1: subject choice
  getStepEl("1").querySelectorAll("[data-subject]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      state.subject = btn.getAttribute("data-subject");
      showStep(state.subject === "english" ? "2-english" : "2-arabic");
    });
  });

  // Step 2a: english need
  getStepEl("2-english").querySelectorAll("[data-need]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      state.need = btn.getAttribute("data-need");
      showStep("3-english");
    });
  });

  // Step 2b: arabic base
  getStepEl("2-arabic").querySelectorAll("[data-base]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      state.base = btn.getAttribute("data-base");
      showStep("3-arabic");
    });
  });

  // Back buttons
  modal.querySelectorAll("[data-back]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      showStep(btn.getAttribute("data-back"));
    });
  });

  // Step 3: continue to final, build Telegram message
  modal.querySelectorAll(".js-to-final").forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (state.subject === "english") {
        var englishTextarea = document.getElementById("english-about");
        state.detail = englishTextarea ? englishTextarea.value.trim() : "";
      } else if (state.subject === "arabic") {
        var arabicTextarea = document.getElementById("arabic-goal");
        state.detail = arabicTextarea ? arabicTextarea.value.trim() : "";
      }
      telegramLink.href = buildTelegramUrl(state);
      showStep("final");
    });
  });

  function buildTelegramUrl(s) {
    var message = "";

    if (s.subject === "english") {
      var direction = s.need || "не указано";
      var about = s.detail || "не указано";
      message =
        "Здравствуйте! Хочу записаться на бесплатное пробное занятие по английскому.\n\n" +
        "Направление: " + direction + "\n" +
        "Немного обо мне: " + about + "\n\n" +
        "Буду рада обсудить формат.";
    } else if (s.subject === "arabic") {
      var base = s.base || "не указано";
      var goal = s.detail || "не указано";
      message =
        "Здравствуйте! Хочу записаться на бесплатное пробное занятие по арабскому.\n\n" +
        "Моя база: " + base + "\n" +
        "Моя цель: " + goal + "\n\n" +
        "Буду рада обсудить формат.";
    } else {
      message = "Здравствуйте! Хочу записаться на бесплатное пробное занятие.";
    }

    return "https://t.me/" + TELEGRAM_USERNAME + "?text=" + encodeURIComponent(message);
  }
})();
