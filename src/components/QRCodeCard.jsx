import { QRCodeSVG } from "qrcode.react";
import "../assets/styles/Common.css";

const QRCodeCard = ({ value }) => {
  const qrValue = String(value || "QTIK");

  return (
    <div className="qr-card" aria-label={`QR ${qrValue}`}>
      <QRCodeSVG
        value={qrValue}
        size={180}
        level="M"
        marginSize={1}
        bgColor="#ffffff"
        fgColor="#0f172a"
      />
    </div>
  );
};

export default QRCodeCard;
