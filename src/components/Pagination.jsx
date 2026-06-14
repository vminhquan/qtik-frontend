import { ChevronLeft, ChevronRight } from "lucide-react";
import "../assets/styles/Common.css";

const Pagination = ({ page, limit, total, onPageChange }) => {
  const safeLimit = Math.max(Number(limit) || 1, 1);
  const totalPages = Math.max(Math.ceil((Number(total) || 0) / safeLimit), 1);
  const currentPage = Math.min(Math.max(Number(page) || 1, 1), totalPages);

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
        <ChevronLeft aria-hidden="true" />
      </button>

      <span className="pagination-summary">
        Trang {currentPage} / {totalPages}
      </span>

      <button
        className="pagination-nav"
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        aria-label="Trang sau"
        title="Trang sau"
      >
        <ChevronRight aria-hidden="true" />
      </button>
    </nav>
  );
};

export default Pagination;
