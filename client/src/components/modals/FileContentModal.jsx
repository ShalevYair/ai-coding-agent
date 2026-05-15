import React, { useState, useEffect } from 'react';

const FileContentModal = ({ isOpen, onClose, filePath, initialContent, onSave }) => {
  const [editedContent, setEditedContent] = useState(initialContent);

  // Update editedContent whenever initialContent changes
  useEffect(() => {
    setEditedContent(initialContent);
  }, [initialContent]);

  if (!isOpen) {
    return null;
  }

  const handleChange = (e) => {
    setEditedContent(e.target.value);
  };

  const handleSave = () => {
    onSave(filePath, editedContent);
    onClose(); // Close modal after saving
  };

  const handleCancel = () => {
    onClose(); // Close modal
  };

  // Basic inline styles for a functional modal. In a real application,
  // these would typically be defined in a CSS file or using a styling library.
  const modalOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  };

  const modalContentStyle = {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    width: '80%',
    maxWidth: '700px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '80%',
  };

  const headerStyle = {
    marginBottom: '15px',
    fontSize: '1.2em',
    fontWeight: 'bold',
    borderBottom: '1px solid #eee',
    paddingBottom: '10px',
  };

  const textareaStyle = {
    width: '100%',
    flexGrow: 1, // Allows textarea to expand and fill available space
    minHeight: '200px',
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    resize: 'vertical',
    fontFamily: 'monospace', // Good for displaying code/text
    fontSize: '0.9em',
  };

  const footerStyle = {
    marginTop: '20px',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px', // Space between buttons
  };

  const buttonStyle = {
    padding: '8px 15px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1em',
  };

  const saveButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#007bff',
    color: 'white',
  };

  const cancelButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#6c757d',
    color: 'white',
  };

  return (
    <div style={modalOverlayStyle} onClick={handleCancel}>
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}> {/* Prevent clicks inside from closing */}
        <div style={headerStyle}>
          עריכת קובץ: {filePath}
        </div>
        <textarea
          style={textareaStyle}
          value={editedContent}
          onChange={handleChange}
        />
        <div style={footerStyle}>
          <button style={cancelButtonStyle} onClick={handleCancel}>
            בטל
          </button>
          <button style={saveButtonStyle} onClick={handleSave}>
            שמור
          </button>
        </div>
      </div>
    </div>
  );
};

// Vercel cache bust comment
export default FileContentModal;