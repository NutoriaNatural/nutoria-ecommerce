(function initializeNutoriaGa4() {
  const measurementId = "G-PKDWSJSZSD";

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() {
    window.dataLayer.push(arguments);
  };

  if (!window.__nutoriaGa4Configured) {
    window.__nutoriaGa4Configured = true;
    window.gtag("js", new Date());
    window.gtag("config", measurementId);
  }

  const loadExternalScript = () => {
    if (document.querySelector("script[data-nutoria-ga4]")) return;
    const script = document.createElement("script");
    script.async = true;
    script.dataset.nutoriaGa4 = "true";
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.append(script);
  };

  if (typeof window.requestAnimationFrame === "function") {
    window.requestAnimationFrame(() => window.requestAnimationFrame(loadExternalScript));
  } else {
    window.setTimeout(loadExternalScript, 0);
  }
})();
