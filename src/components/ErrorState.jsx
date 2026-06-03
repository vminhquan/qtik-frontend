import "../assets/styles/Common.css";

const ErrorState = ({ message, onRetry }) => (
  <div className="error-state" role="alert">
    <strong>Không tải được dữ liệu</strong>
    <span>{message}</span>
    {onRetry && (
      <button type="button" onClick={onRetry}>
        Thử lại
      </button>
    )}
  </div>
);

export default ErrorState;
