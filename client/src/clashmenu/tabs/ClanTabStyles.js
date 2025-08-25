/* ===== CSS SUPPLÉMENTAIRE POUR CLANCONTENT ===== */

/* Chat Welcome Message */
.chat-welcome {
  text-align: center;
  padding: 2rem;
  color: var(--color-gray-400);
}

.welcome-message h3 {
  color: var(--color-gold);
  margin-bottom: 0.5rem;
  font-size: 1.2rem;
}

.welcome-message p {
  margin: 0;
  font-size: 0.9rem;
}

/* Header Actions */
.clan-actions {
  display: flex;
  gap: 0.5rem;
}

.clan-action-btn.small {
  padding: 0.5rem;
  font-size: 0.8rem;
  min-width: auto;
}

.clan-action-btn.danger {
  background: linear-gradient(135deg, var(--color-danger), #d32f2f);
  color: white;
}

.clan-action-btn.danger:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(244, 67, 54, 0.4);
}

/* Members Actions */
.members-actions {
  display: flex;
  gap: 0.5rem;
}

.loading-members {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: var(--color-gray-400);
  gap: 1rem;
}

/* Member Status */
.member-status.online {
  color: var(--color-success);
}

.member-status.offline {
  color: var(--color-gray-500);
}

/* Donation Stats */
.donation-stats {
  display: flex;
  justify-content: space-around;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.donation-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.donation-stat .stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--color-gold);
}

.donation-stat .stat-label {
  font-size: 0.8rem;
  color: var(--color-gray-500);
}

/* No Donations State */
.no-donations {
  text-align: center;
  padding: 2rem;
  color: var(--color-gray-400);
}

.no-donations-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.6;
}

.no-donations h3 {
  color: var(--color-white);
  margin-bottom: 0.5rem;
}

.no-donations p {
  margin: 0;
  font-size: 0.9rem;
}

/* Donation Time */
.donation-time {
  font-size: 0.75rem;
  color: var(--color-gray-500);
  margin-top: 0.25rem;
}

/* War Info */
.war-info {
  display: flex;
  justify-content: space-around;
  margin-top: 2rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.75rem;
}

.war-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.war-stat .stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--color-gold);
}

.war-stat .stat-label {
  font-size: 0.8rem;
  color: var(--color-gray-500);
}

.war-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
  flex-wrap: wrap;
  justify-content: center;
}

/* Request Card Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.modal-content {
  background: linear-gradient(135deg, var(--color-dark-blue), var(--color-royal-blue));
  border-radius: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header h3 {
  color: var(--color-white);
  margin: 0;
  font-size: 1.5rem;
}

.modal-close {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 50%;
  width: 2.5rem;
  height: 2.5rem;
  color: var(--color-white);
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.modal-close:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

.modal-body {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
}

.modal-footer {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-footer .clan-action-btn {
  flex: 1;
}

/* Card Selector */
.card-selector {
  margin-bottom: 1.5rem;
}

.selected-card {
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid var(--color-gold);
  border-radius: 0.75rem;
  padding: 1rem;
  text-align: center;
  margin-bottom: 1rem;
  min-height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

.card-placeholder {
  color: var(--color-gray-400);
  font-style: italic;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 0.75rem;
}

.card-option {
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  padding: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.card-option:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.card-option.selected {
  background: rgba(255, 215, 0, 0.2);
  border-color: var(--color-gold);
  box-shadow: 0 0 0 2px rgba(255, 215, 0, 0.3);
}

.card-option.common {
  border-left-color: var(--color-gray-400);
}

.card-option.rare {
  border-left-color: var(--color-warning);
}

.card-option.epic {
  border-left-color: var(--color-purple);
}

.card-icon {
  font-size: 2rem;
}

.card-name {
  color: var(--color-white);
  font-size: 0.8rem;
  font-weight: 500;
}

/* Amount Selector */
.amount-selector {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.amount-selector label {
  color: var(--color-white);
  font-weight: 500;
}

.amount-selector input {
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.5rem;
  padding: 0.75rem;
  color: var(--color-white);
  font-size: 1rem;
  width: 100px;
}

.amount-selector input:focus {
  outline: none;
  border-color: var(--color-gold);
  box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.1);
}

/* Notifications */
.clan-notification {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  z-index: 1000;
  animation: slideInDown 0.3s ease-out;
  backdrop-filter: blur(8px);
}

.clan-notification.error {
  background: rgba(244, 67, 54, 0.2);
  border: 1px solid var(--color-danger);
}

.clan-notification.success {
  background: rgba(76, 175, 80, 0.2);
  border: 1px solid var(--color-success);
}

.clan-notification.info {
  background: rgba(33, 150, 243, 0.2);
  border: 1px solid var(--color-info);
}

.notification-icon {
  font-size: 1rem;
}

.notification-text {
  color: var(--color-white);
  font-size: 0.9rem;
  font-weight: 500;
}

@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

/* Responsive Design for Modal */
@media (max-width: 480px) {
  .modal-content {
    margin: 1rem;
    max-width: calc(100vw - 2rem);
  }
  
  .card-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .modal-footer {
    flex-direction: column;
  }
}

/* Focus States for Accessibility */
.card-option:focus {
  outline: 2px solid var(--color-gold);
  outline-offset: 2px;
}
