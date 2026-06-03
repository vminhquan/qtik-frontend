import "../assets/styles/Common.css";

const QRCodeCard = ({ value }) => {
  const seed = String(value || "QTIK");
  const cells = Array.from({ length: 49 }, (_, index) => {
    const code = seed.charCodeAt(index % seed.length);
    return (code + index * 7) % 3 !== 0;
  });

  return (
    <div className="qr-card" aria-label={`QR ${seed}`}>
      {cells.map((active, index) => (
        <span key={index} className={active ? "qr-cell-active" : ""} />
      ))}
    </div>
  );
};

export default QRCodeCard;
