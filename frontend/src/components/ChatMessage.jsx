function ChatMessage({ message }) { return <div className={`chat-message ${message.role}`}><div className="chat-avatar">{message.role === 'assistant' ? <i className="bi bi-stars" /> : 'DS'}</div><div><span className="message-author">{message.role === 'assistant' ? 'StudentDrive AI' : 'You'}</span><p>{message.text}</p></div></div>; }
export default ChatMessage;
