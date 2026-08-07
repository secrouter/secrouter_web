// SecRouter site — progressive enhancement only (full content works with JS off).
(function () {
  "use strict";
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  var y = document.getElementById("year");
  if (y) y.textContent = String(new Date().getFullYear());

  // Mobile nav.
  var header = document.querySelector(".nav-wrap");
  var toggle = document.querySelector(".nav-toggle");
  if (header && toggle) {
    toggle.addEventListener("click", function () {
      var open = header.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    header.querySelectorAll(".nav-links a, .nav-access").forEach(function (a) {
      a.addEventListener("click", function () {
        header.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Sticky-nav border once scrolled.
  if (header) {
    var onScroll = function () { header.classList.toggle("scrolled", window.scrollY > 8); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // Scroll reveal.
  var items = document.querySelectorAll(".reveal");
  if (!reduce && "IntersectionObserver" in window && items.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add("is-visible"); });
  }

  // Count-up on the spend figure when it scrolls into view.
  var fig = document.querySelector(".big[data-count]");
  if (fig && !reduce && "IntersectionObserver" in window) {
    var target = parseInt(fig.getAttribute("data-count"), 10) || 0;
    var prefix = fig.getAttribute("data-prefix") || "";
    var fmt = function (n) { return prefix + Math.round(n).toLocaleString("en-US"); };
    var io2 = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        io2.unobserve(e.target);
        var start = null, dur = 1100;
        var step = function (t) {
          if (start === null) start = t;
          var p = Math.min((t - start) / dur, 1);
          fig.textContent = fmt(target * (1 - Math.pow(1 - p, 3))); // easeOutCubic
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    }, { threshold: 0.5 });
    io2.observe(fig);
  }

  // Hero rotator: cycle the "Secure AI ___" endings, then land on the last one ("now.").
  // The element's default text is already the final word, so no-JS and reduced-motion
  // visitors — and screen readers (the line is aria-labelled) — just see "Secure AI now."
  var rot = document.querySelector(".hero-rot .rot");
  if (rot && !reduce) {
    var words = (rot.getAttribute("data-words") || "").split("|").filter(Boolean);
    if (words.length > 1) {
      var i = 0, DWELL = 1300, FADE = 300;
      rot.textContent = words[0];
      var advance = function () {
        rot.classList.add("rot-out");
        setTimeout(function () {
          rot.textContent = words[++i];
          rot.classList.remove("rot-out");
          if (i < words.length - 1) setTimeout(advance, DWELL);
          else rot.classList.add("rot-final");
        }, FADE);
      };
      setTimeout(advance, DWELL);
    }
  }
})();
