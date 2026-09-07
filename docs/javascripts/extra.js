document$.subscribe(function () {
  console.log("miki-template docs initialized");

  const navbar = document.querySelector(".md-header");
  if (navbar) {
    let lastScroll = 0;
    const scrollThreshold = 50;

    window.addEventListener("scroll", function () {
      const currentScroll = window.pageYOffset;

      if (currentScroll <= 0) {
        navbar.style.boxShadow = "0 2px 8px var(--md-shadow-color)";
        return;
      }

      if (currentScroll > lastScroll && currentScroll > scrollThreshold) {
        navbar.style.transform = "translateY(-100%)";
        navbar.style.transition = "transform 0.3s ease";
      } else {
        navbar.style.transform = "translateY(0)";
        navbar.style.transition = "transform 0.3s ease";
      }

      lastScroll = currentScroll;
    });
  }

  document.querySelectorAll(".md-clipboard").forEach(function (button) {
    button.addEventListener("click", async function () {
      const code = this.closest(".highlight").querySelector("code").innerText;

      try {
        await navigator.clipboard.writeText(code);
        const originalHTML = this.innerHTML;
        this.innerHTML = '<span class="md-icon">&#10003;</span> Copied!';
        this.style.color = "var(--md-accent-fg-color)";
        this.style.opacity = "1";

        setTimeout(function () {
          button.innerHTML = originalHTML;
          button.style.color = "";
          button.style.opacity = "";
        }, 2000);
      } catch (err) {
        console.error("Failed to copy: ", err);
      }
    });
  });

  document.querySelectorAll(".md-typeset a[href^='#']").forEach(function (anchor) {
    anchor.addEventListener("click", function (e) {
      const targetId = this.getAttribute("href");
      if (targetId === "#") return;

      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        const headerOffset = 80;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });

        history.replaceState(null, null, targetId);
      }
    });
  });

  document.querySelectorAll(".md-typeset .task-list-item input[type='checkbox']").forEach(function (checkbox) {
    checkbox.addEventListener("change", function () {
      const label = this.closest(".task-list-item");
      if (this.checked) {
        label.style.opacity = "0.6";
        label.style.textDecoration = "line-through";
      } else {
        label.style.opacity = "1";
        label.style.textDecoration = "none";
      }
    });
  });

  document.querySelectorAll(".md-tabs__link").forEach(function (tab) {
    tab.addEventListener("click", function () {
      document.querySelectorAll(".md-tabs__link").forEach(function (t) {
        t.style.transform = "scale(1)";
      });
      this.style.transform = "scale(1.05)";
      setTimeout(function () {
        tab.style.transform = "scale(1)";
      }, 200);
    });
  });

  document.querySelectorAll(".md-typeset .tabbed-set > label").forEach(function (tabLabel) {
    tabLabel.addEventListener("click", function () {
      this.style.transform = "scale(0.98)";
      setTimeout(function () {
        tabLabel.style.transform = "scale(1)";
      }, 100);
    });
  });

  const searchInput = document.querySelector(".md-search__input");
  if (searchInput) {
    searchInput.addEventListener("focus", function () {
      this.parentElement.style.boxShadow = "0 0 0 3px var(--md-accent-fg-color), 0 4px 12px var(--md-shadow-color)";
      this.parentElement.style.transition = "box-shadow 0.2s ease";
    });

    searchInput.addEventListener("blur", function () {
      this.parentElement.style.boxShadow = "";
    });
  }

  document.querySelectorAll(".md-typeset .admonition").forEach(function (admonition) {
    admonition.addEventListener("mouseenter", function () {
      this.style.transform = "translateY(-2px)";
      this.style.transition = "transform 0.2s ease";
    });

    admonition.addEventListener("mouseleave", function () {
      this.style.transform = "translateY(0)";
    });
  });

  document.querySelectorAll(".md-typeset .md-button").forEach(function (button) {
    button.addEventListener("mouseenter", function () {
      this.style.transform = "translateY(-2px)";
    });

    button.addEventListener("mouseleave", function () {
      this.style.transform = "translateY(0)";
    });
  });

  document.querySelectorAll(".md-content__inner table:not([class]) tbody tr").forEach(function (row) {
    row.addEventListener("mouseenter", function () {
      this.style.transition = "background-color 0.2s ease";
    });
  });

  const observerOptions = {
    root: null,
    rootMargin: "0px",
    threshold: 0.1,
  };

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.style.opacity = "1";
        entry.target.style.transform = "translateY(0)";
      }
    });
  }, observerOptions);

  document.querySelectorAll(".md-typeset h2, .md-typeset h3, .md-typeset .admonition").forEach(function (el) {
    el.style.opacity = "0";
    el.style.transform = "translateY(10px)";
    el.style.transition = "opacity 0.5s ease, transform 0.5s ease";
    observer.observe(el);
  });

  setTimeout(function () {
    document.querySelectorAll(".md-typeset h2, .md-typeset h3, .md-typeset .admonition").forEach(function (el) {
      el.style.opacity = "1";
      el.style.transform = "translateY(0)";
    });
  }, 100);
});
