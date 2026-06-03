import "../assets/styles/Common.css";

const LoadingState = ({ label = "Đang tải dữ liệu...", fullScreen = false }) => (
  <div className={fullScreen ? "state state-fullscreen" : "state"}>
    <span className="state-spinner" aria-hidden="true" />
    <span>{label}</span>
  </div>
);

export default LoadingState;
