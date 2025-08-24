class CardModalStyles {
  static getCSS() {
    return `
.card-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.75);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 20000;
  animation: fadeIn 0.2s ease;
}
.card-modal {
  background: #1e2433;
  color: #fff;
  border-radius: 12px;
  padding: 20px;
  width: 340px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 6px 20px rgba(0,0,0,0.5);
  animation: popIn 0.2s ease;
}

.cm-upgrade-progress {
  position: relative;
  background: #2c3e50;
  border-radius: 4px;
  height: 18px;
  margin-bottom: 10px;
  overflow: hidden;
  font-size: 12px;
  color: #fff;
  text-align: center;
  line-height: 18px;
}

.cm-upgrade-fill {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  background: #27ae60;
  transition: width 0.3s ease;
}

.cm-upgrade-progress span {
  position: relative;
  z-index: 2;
  font-weight: bold;
}

.card-modal-close {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #fff;
  transition: color 0.2s;
}
.card-modal-close:hover {
  color: #ff6b6b;
}
.card-modal-header {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}
.cm-sprite {
  width: 70px;
  height: 70px;
  margin-right: 15px;
  border-radius: 8px;
  object-fit: contain;
  background: #2c3e50;
  border: 2px solid #444;
}
.cm-title {
  flex: 1;
}
.cm-title h3 {
  margin: 0 0 5px 0;
  color: #ffd700;
  font-size: 18px;
  font-weight: bold;
}
.cm-meta {
  color: #bdc3c7;
  font-size: 13px;
}
.card-modal-body {
  margin-bottom: 15px;
  color: #ecf0f1;
}
.cm-level {
  margin-bottom: 10px;
  font-size: 14px;
}
.cm-level-value {
  color: #3498db;
  font-weight: bold;
}
.cm-max-badge {
  background: #9b59b6;
  color: #fff;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  margin-left: 10px;
  font-weight: bold;
}

/* Stats */
.cm-stats {
  margin: 10px 0;
  padding: 10px;
  background: rgba(52, 73, 94, 0.35);
  border-radius: 6px;
  font-size: 13px;
}
.cm-stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 12px;
}
.cm-stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(0,0,0,0.2);
  padding: 6px 8px;
  border-radius: 4px;
}
.cm-stat-icon {
  font-size: 14px;
}
.cm-stat-label {
  font-weight: bold;
  flex: 1;
}
.cm-stat-value {
  color: #ffd700;
  font-weight: bold;
}

/* Upgrade section */
.cm-upgrade {
  margin: 12px 0;
  padding: 10px;
  background: rgba(241, 196, 15, 0.1);
  border-radius: 6px;
  border-left: 3px solid #f1c40f;
}
.cm-upgrade-req {
  color: #f39c12;
  font-size: 12px;
  margin-bottom: 8px;
  display: block;
}
.cm-upgrade-btn {
  margin-top: 5px;
  padding: 8px 16px;
  background: #f39c12;
  border: none;
  border-radius: 6px;
  color: #fff;
  font-weight: bold;
  cursor: pointer;
  font-size: 13px;
  transition: background 0.2s ease;
}
.cm-upgrade-btn:hover:not(:disabled) {
  background: #e67e22;
}
.cm-upgrade-btn:disabled {
  background: #555;
  cursor: not-allowed;
  opacity: 0.6;
}

/* Actions */
.card-modal-actions {
  text-align: center;
  border-top: 1px solid #34495e;
  padding-top: 15px;
  margin-top: 10px;
}
.cm-add-btn {
  background: #2ecc71;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 12px 24px;
  cursor: pointer;
  font-weight: bold;
  width: 100%;
  font-size: 14px;
  transition: background 0.2s ease, transform 0.1s;
}
.cm-add-btn:hover {
  background: #27ae60;
}
.cm-add-btn:active {
  transform: translateY(1px);
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes popIn {
  from { transform: scale(0.9); opacity: 0; }
  to   { transform: scale(1); opacity: 1; }
}
    `;
  }
}
export default CardModalStyles;
