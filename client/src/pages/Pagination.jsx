import React from "react";

function buildItems(page, total) {
  const items = new Set([1, total, page - 1, page, page + 1, page - 2, page + 2]);
  // keep only valid pages
  const list = [...items].filter(p => p >= 1 && p <= total).sort((a, b) => a - b);

  // insert ellipses markers "…"
  const withDots = [];
  for (let i = 0; i < list.length; i++) {
    withDots.push(list[i]);
    if (i < list.length - 1 && list[i + 1] !== list[i] + 1) withDots.push("…");
  }
  return withDots;
}

export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  const items = buildItems(page, totalPages);

  const go = (p) => {
    if (typeof p !== "number") return;
    if (p < 1 || p > totalPages || p === page) return;
    onChange(p);
  };

  return (
    <nav className="pager" aria-label="Pagination">
      <button
        className="pager__btn"
        onClick={() => go(1)}
        disabled={page === 1}
        aria-label="First page"
      >
        «
      </button>
      <button
        className="pager__btn"
        onClick={() => go(page - 1)}
        disabled={page === 1}
        aria-label="Previous page"
      >
        ‹
      </button>

      <ul className="pager__list">
        {items.map((it, idx) =>
          it === "…" ? (
            <li key={`dots-${idx}`} className="pager__dots">…</li>
          ) : (
            <li key={it}>
              <button
                className={`pager__btn ${it === page ? "is-active" : ""}`}
                aria-current={it === page ? "page" : undefined}
                onClick={() => go(it)}
              >
                {it}
              </button>
            </li>
          )
        )}
      </ul>

      <button
        className="pager__btn"
        onClick={() => go(page + 1)}
        disabled={page === totalPages}
        aria-label="Next page"
      >
        ›
      </button>
      <button
        className="pager__btn"
        onClick={() => go(totalPages)}
        disabled={page === totalPages}
        aria-label="Last page"
      >
        »
      </button>
    </nav>
  );
}
