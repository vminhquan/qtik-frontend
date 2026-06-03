import { useState } from "react";
import { aiService } from "../api/aiService";
import { getErrorMessage } from "../utils/errorHandler";
import "../assets/styles/Chatbot.css";

const FloatingChatbot = () => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Xin chào, tôi có thể gợi ý phim, suất chiếu và giá vé cho bạn." },
  ]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const content = message.trim();
    if (!content) return;

    setMessage("");
    setMessages((prev) => [...prev, { role: "user", content }]);
    setLoading(true);

    try {
      const response = await aiService.sendMessage({ message: content });
      const answer = response?.answer || response?.message || response?.data?.answer || "Tôi đã ghi nhận câu hỏi của bạn.";
      setMessages((prev) => [...prev, { role: "assistant", content: answer }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", content: getErrorMessage(err, "AI hiện chưa phản hồi được.") }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chatbot">
      {open && (
        <section className="chatbot-panel" aria-label="QTIK AI assistant">
          <header>
            <strong>QTIK AI</strong>
            <button type="button" onClick={() => setOpen(false)}>Đóng</button>
          </header>
          <div className="chatbot-messages">
            {messages.map((item, index) => (
              <p key={`${item.role}-${index}`} className={`chatbot-message ${item.role}`}>
                {item.content}
              </p>
            ))}
            {loading && <p className="chatbot-message assistant">Đang tìm thông tin...</p>}
          </div>
          <form onSubmit={handleSubmit}>
            <input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Hôm nay có phim gì?"
            />
            <button type="submit">Gửi</button>
          </form>
        </section>
      )}

      <button className="chatbot-toggle" type="button" onClick={() => setOpen((prev) => !prev)}>
        AI
      </button>
    </div>
  );
};

export default FloatingChatbot;
