export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  if (import.meta.env.DEV) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) =>
          Promise.all(
            registrations
              .filter((registration) => registration.scope.includes('/sheetly/'))
              .map((registration) => registration.unregister()),
          ),
        )
        .catch(() => {
          // Development cleanup is best-effort.
        });
    });
    return;
  }

  window.addEventListener('load', () => {
    const serviceWorkerUrl = `${import.meta.env.BASE_URL}sw.js`;

    navigator.serviceWorker.register(serviceWorkerUrl).catch(() => {
      // PWA registration is a progressive enhancement; app usage should not fail here.
    });
  });
}
