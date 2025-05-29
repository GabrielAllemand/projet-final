import React from 'react';
import styles from './SettingsPage.module.css'; // Import des styles

export default function SettingsPage() {
  // Fonctions placeholder pour les actions futures
  const handleChangePassword = () => {
    alert('Changer le mot de passe cliqué');
    // Implémenter la logique de changement de mot de passe ici
  };

  const handleLogout = () => {
    alert('Déconnexion cliquée');
    // Implémenter la logique de déconnexion ici
  };

  const handlePremiumUpgrade = () => {
    alert('Passer au plan Premium cliqué');
    // Implémenter la logique d'abonnement Premium ici
  };

  return (
    <div className={styles.container}>
      <h1>Paramètres</h1>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Compte</h2>
        <button 
          onClick={handleChangePassword} 
          className={styles.primaryButton}
        >
          Changer mon mot de passe
        </button>
        <button 
          onClick={handleLogout} 
          className={styles.dangerButton}
        >
          Déconnexion
        </button>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Abonnement</h2>
        <button 
          onClick={handlePremiumUpgrade} 
          className={styles.warningButton}
        >
          Passer au plan Premium
        </button>
      </div>
    </div>
  );
} 