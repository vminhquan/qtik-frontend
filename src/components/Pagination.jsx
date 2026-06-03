import "../assets/styles/Common.css";

const Pagination = ({ page, limit, total, onPageChange }) => {
  const totalPages = Math.max(Math.ceil(total / limit), 1);

  return (
    <div className="pagination" aria-label="Pagination">
      <button type="button" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
        Trước
      </button>
      <span>
        Trang {page} / {totalPages}
      </span>
      <button type="button" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
        Sau
      </button>
    </div>
  );
};

export default Pagination;
