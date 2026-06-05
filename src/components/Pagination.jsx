import "../assets/styles/Common.css";

const getVisiblePages = (currentPage, totalPages) => {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3) return [1, 2, 3, "ellipsis-end", totalPages];
  if (currentPage >= totalPages - 2) {
    return [1, "ellipsis-start", totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, "ellipsis-start", currentPage, "ellipsis-end", totalPages];
};

const Pagination = ({ page, limit, total, onPageChange }) => {
  const safeLimit = Math.max(Number(limit) || 1, 1);
  const totalPages = Math.max(Math.ceil((Number(total) || 0) / safeLimit), 1);
  const currentPage = Math.min(Math.max(Number(page) || 1, 1), totalPages);
  const visiblePages = getVisiblePages(currentPage, totalPages);

  if (totalPages <= 1) return null;

  return (
    <nav className="pagination" aria-label="Phân trang">
      <button
        className="pagination-nav"
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        aria-label="Trang trước"
        title="Trang trước"
      >
        <span aria-hidden="true">‹</span>
      </button>

      <div className="pagination-pages">
        {visiblePages.map((item) => (
          typeof item === "number" ? (
            <button
              className={item === currentPage ? "pagination-page active" : "pagination-page"}
              type="button"
              key={item}
              onClick={() => onPageChange(item)}
              aria-current={item === currentPage ? "page" : undefined}
              aria-label={`Trang ${item}`}
            >
              {item}
            </button>
          ) : (
            <span className="pagination-ellipsis" key={item} aria-hidden="true">…</span>
          )
        ))}
      </div>

      <button
        className="pagination-nav"
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        aria-label="Trang sau"
        title="Trang sau"
      >
        <span aria-hidden="true">›</span>
      </button>
      <span className="pagination-summary">Trang {currentPage} / {totalPages}</span>
    </nav>
  );
};

export default Pagination;
