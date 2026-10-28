"use strict";

(function () {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  /* ---------- release info ---------- */

  function formatSize(bytes) {
    if (!Number.isFinite(bytes) || bytes <= 0) return "—";
    const mib = bytes / (1024 * 1024);
    return (mib >= 100 ? Math.round(mib) : Math.round(mib * 10) / 10) + " MB";
  }

  function setText(selector, value) {
    $$(selector).forEach((node) => {
      node.textContent = value;
    });
  }

  function hideHash() {
    const row = $(".file-facts-wide");
    if (row) row.hidden = true;
    const verify = $(".verify");
    if (verify) verify.hidden = true;
  }

  function metaValue(name) {
    const node = document.querySelector(`meta[name="${name}"]`);
    return node ? node.content.trim() : "";
  }

  /*
   * Static hosting (GitHub Pages, Cloudflare Pages...) has no /api/release, so the
   * page falls back to the version and checksum published in the HTML meta tags.
   */
  function applyStaticRelease() {
    const version = metaValue("xcode-version");
    if (version) setText("[data-version]", version);

    const sha256 = metaValue("xcode-sha256");
    const hash = $("#sha-value");
    const copy = $('.copy[data-copy-target="sha-value"]');
    if (hash && sha256) {
      hash.textContent = sha256;
      if (copy) {
        copy.dataset.copy = sha256;
        copy.hidden = false;
      }
    } else {
      hideHash();
    }
  }

  async function loadRelease() {
    let data;
    try {
      const response = await fetch("api/release", { headers: { Accept: "application/json" } });
      if (!response.ok) {
        applyStaticRelease();
        return;
      }
      data = await response.json();
    } catch (error) {
      applyStaticRelease(); // static hosting: use the meta tag values
      return;
    }

    if (data.version) setText("[data-version]", data.version);

    const installer = data.installer;
    if (installer && installer.available) {
      setText('[data-size="installer"]', formatSize(installer.size));
      const link = $("#download-installer");
      if (link) {
        link.href = "download/" + installer.name;
        link.setAttribute("download", installer.name);
      }

      const hash = $("#sha-value");
      const copy = $('.copy[data-copy-target="sha-value"]');
      if (hash && installer.sha256) {
        hash.textContent = installer.sha256;
        if (copy) {
          copy.dataset.copy = installer.sha256;
          copy.hidden = false;
        }
      } else {
        hideHash();
      }
    } else {
      const link = $("#download-installer");
      if (link) {
        link.textContent = "Installer not available";
        link.removeAttribute("href");
        link.setAttribute("aria-disabled", "true");
        link.addEventListener("click", (event) => event.preventDefault());
      }
      hideHash();
    }

    const portable = data.portable;
    const portableLink = $("#download-portable");
    const portableWrap = portableLink ? portableLink.closest(".download-alt") : null;
    if (portable && portable.available) {
      setText('[data-size="portable"]', formatSize(portable.size));
      if (portableLink) {
        portableLink.href = "download/" + portable.name;
        portableLink.setAttribute("download", portable.name);
      }
    } else if (portableWrap) {
      portableWrap.hidden = true;
    }
  }

  /* ---------- copy to clipboard ---------- */

  const toast = $("#toast");
  let toastTimer = 0;

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("show"), 1800);
  }

  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (error) {
      /* fall through to the legacy path */
    }

    try {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.top = "-1000px";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(area);
      return ok;
    } catch (error) {
      return false;
    }
  }

  $$(".copy").forEach((button) => {
    button.addEventListener("click", async () => {
      const targetId = button.dataset.copyTarget;
      const text = targetId
        ? (document.getElementById(targetId) || {}).textContent
        : button.dataset.copy;
      if (!text) return;

      const ok = await copyText(text.trim());
      if (!ok) {
        showToast("Could not copy — select the text manually.");
        return;
      }

      const original = button.textContent;
      button.textContent = "Copied";
      button.classList.add("is-copied");
      window.setTimeout(() => {
        button.textContent = original;
        button.classList.remove("is-copied");
      }, 1600);
    });
  });

  /* ---------- mobile navigation ---------- */

  const nav = $("#site-nav");
  const navToggle = $(".nav-toggle");

  function closeNav() {
    if (!nav || !navToggle) return;
    nav.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open menu");
  }

  if (nav && navToggle) {
    navToggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(open));
      navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });

    nav.addEventListener("click", (event) => {
      if (event.target.closest("a")) closeNav();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeNav();
    });

    document.addEventListener("click", (event) => {
      if (!nav.classList.contains("is-open")) return;
      if (event.target.closest(".site-header")) return;
      closeNav();
    });
  }

  /* ---------- reveal on scroll ---------- */

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const revealItems = $$(".reveal");

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  } else {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );

    revealItems.forEach((item, index) => {
      item.style.transitionDelay = Math.min(index % 6, 5) * 45 + "ms";
      observer.observe(item);
    });
  }

  /* ---------- misc ---------- */

  const year = $("#year");
  if (year) year.textContent = String(new Date().getFullYear());

  loadRelease();
})();
