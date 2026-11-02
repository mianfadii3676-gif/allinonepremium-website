/**
 * "Flip to cart": a copy of the product image flips in 3D and arcs into the header cart icon,
 * which then bounces. Skipped for reduced-motion users or when either element is missing.
 */
export function flyToCart(source: HTMLElement | null | undefined) {
  if (typeof window === "undefined" || !source) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return bumpCart();

  const target = document.querySelector<HTMLElement>("[data-cart-target]");
  if (!target) return;

  const from = source.getBoundingClientRect();
  const to = target.getBoundingClientRect();
  if (from.width === 0 || to.width === 0) return;

  const size = Math.min(from.width, from.height, 220);
  const startX = from.left + from.width / 2 - size / 2;
  const startY = from.top + from.height / 2 - size / 2;
  const dx = to.left + to.width / 2 - (startX + size / 2);
  const dy = to.top + to.height / 2 - (startY + size / 2);

  const img = source.querySelector("img");
  const ghost = document.createElement("div");
  ghost.setAttribute("aria-hidden", "true");
  Object.assign(ghost.style, {
    position: "fixed",
    left: `${startX}px`,
    top: `${startY}px`,
    width: `${size}px`,
    height: `${size}px`,
    zIndex: "200",
    pointerEvents: "none",
    borderRadius: "16px",
    overflow: "hidden",
    background: "#eef1f6",
    boxShadow: "0 24px 50px -12px rgba(7,11,22,0.55), 0 0 0 2px rgba(217,173,92,0.8)",
    backfaceVisibility: "visible",
    willChange: "transform, opacity",
  } satisfies Partial<CSSStyleDeclaration>);
  if (img) {
    const copy = document.createElement("img");
    copy.src = img.currentSrc || img.src;
    copy.alt = "";
    Object.assign(copy.style, { width: "100%", height: "100%", objectFit: "cover" });
    ghost.appendChild(copy);
  }
  document.body.appendChild(ghost);

  // Arc upward through the midpoint while flipping a full turn on the Y axis and shrinking.
  const lift = Math.min(160, Math.abs(dy) * 0.4 + 60);
  const anim = ghost.animate(
    [
      { transform: "perspective(800px) translate(0,0) rotateY(0deg) scale(1)", opacity: 1 },
      { transform: `perspective(800px) translate(${dx * 0.45}px, ${dy * 0.45 - lift}px) rotateY(200deg) scale(0.7)`, opacity: 1, offset: 0.5 },
      { transform: `perspective(800px) translate(${dx}px, ${dy}px) rotateY(360deg) scale(0.12)`, opacity: 0.4 },
    ],
    { duration: 850, easing: "cubic-bezier(0.45, 0, 0.2, 1)" }
  );
  anim.onfinish = () => {
    ghost.remove();
    bumpCart();
  };
  anim.oncancel = () => ghost.remove();
}

function bumpCart() {
  document.querySelector<HTMLElement>("[data-cart-target]")?.animate(
    [
      { transform: "scale(1) rotate(0)" },
      { transform: "scale(1.3) rotate(-12deg)" },
      { transform: "scale(0.92) rotate(8deg)" },
      { transform: "scale(1) rotate(0)" },
    ],
    { duration: 500, easing: "ease-out" }
  );
}
