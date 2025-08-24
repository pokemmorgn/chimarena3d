class CardModalStyles {
  static getCSS() {
    return `
.card-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
}
.card-modal {
  background: #1a1f2b;
  color: #fff;
  border-radius: 10px;
  padding: 20px;
  width: 320px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}
.card-modal-close {
  position: absolute;
  top: 8px;
  right: 8px;
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #fff;
}
.cm-title { margin-left: 10px; }
.cm-upgrade-btn {
  margin-top: 10px;
  padding: 8px;
  background: #f39c12;
  border: none;
  border-radius: 6px;
  color: #fff;
  font-weight: bold;
  cursor: pointer;
}
.cm-upgrade-btn:disabled {
  background: #555;
  cursor: not-allowed;
}
    `;
  }
}
export default CardModalStyles;
