import React, { useState } from 'react';

const LandingPage = ({ onLoginClick, onSignupClick }) => {
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  // États pour les champs du formulaire de connexion
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // États pour les champs du formulaire d'inscription
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');

  const toggleLogin = () => {
    setShowLogin(!showLogin);
    setShowSignup(false); // Fermer le formulaire d'inscription si ouvert
    // Réinitialiser les champs si le formulaire est fermé
    if (!showLogin) {
        setLoginEmail('');
        setLoginPassword('');
    }
  };

  const toggleSignup = () => {
    setShowSignup(!showSignup);
    setShowLogin(false); // Fermer le formulaire de connexion si ouvert
     // Réinitialiser les champs si le formulaire est fermé
    if (!showSignup) {
        setSignupEmail('');
        setSignupPassword('');
        setSignupConfirmPassword('');
    }
  };

   // Gestionnaires pour les changements de champs
   const handleLoginEmailChange = (e) => setLoginEmail(e.target.value);
   const handleLoginPasswordChange = (e) => setLoginPassword(e.target.value);
   const handleSignupEmailChange = (e) => setSignupEmail(e.target.value);
   const handleSignupPasswordChange = (e) => setSignupPassword(e.target.value);
   const handleSignupConfirmPasswordChange = (e) => setSignupConfirmPassword(e.target.value);

  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <h1>Orthéloquence</h1>
      {/* Placeholder pour le logo */}
      <div style={{ width: '100px', height: '100px', backgroundColor: '#ccc', margin: '20px auto' }}>
        Logo Placeholder
      </div>
      <p>Améliorez votre éloquence et votre prise de parole en public</p>
      
      <div style={{ marginTop: '30px', marginBottom: '30px' }}>
        <button onClick={toggleLogin} style={{ marginRight: '10px', padding: '10px 20px' }}>Se connecter</button>
        <button onClick={toggleSignup} style={{ padding: '10px 20px' }}>S'inscrire</button>
      </div>

      {/* Formulaire de connexion (affiché conditionnellement) */}
      {showLogin && (
        <div style={{ border: '1px solid #ccc', padding: '20px', maxWidth: '300px', margin: '20px auto', borderRadius: '8px' }}>
          <h3>Se connecter</h3>
          <form onSubmit={(e) => { e.preventDefault(); onLoginClick(); }}> {/* onSubmit temporaire */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Email:</label>
              <input type="email" style={{ width: '100%', padding: '8px' }} value={loginEmail} onChange={handleLoginEmailChange} />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Mot de passe:</label>
              <input type="password" style={{ width: '100%', padding: '8px' }} value={loginPassword} onChange={handleLoginPasswordChange} />
            </div>
            <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Connexion</button>
          </form>
        </div>
      )}

      {/* Formulaire d'inscription (affiché conditionnellement) */}
      {showSignup && (
         <div style={{ border: '1px solid #ccc', padding: '20px', maxWidth: '300px', margin: '20px auto', borderRadius: '8px' }}>
           <h3>S'inscrire</h3>
           <form onSubmit={(e) => { e.preventDefault(); onSignupClick(); }}> {/* onSubmit temporaire */}
             <div style={{ marginBottom: '15px' }}>
               <label style={{ display: 'block', marginBottom: '5px' }}>Email:</label>
               <input type="email" style={{ width: '100%', padding: '8px' }} value={signupEmail} onChange={handleSignupEmailChange} />
             </div>
             <div style={{ marginBottom: '15px' }}>
               <label style={{ display: 'block', marginBottom: '5px' }}>Mot de passe:</label>
               <input type="password" style={{ width: '100%', padding: '8px' }} value={signupPassword} onChange={handleSignupPasswordChange} />
             </div>
              <div style={{ marginBottom: '15px' }}>
               <label style={{ display: 'block', marginBottom: '5px' }}>Confirmer mot de passe:</label>
               <input type="password" style={{ width: '100%', padding: '8px' }} value={signupConfirmPassword} onChange={handleSignupConfirmPasswordChange} />
             </div>
             <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#2196f3', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Inscription</button>
           </form>
         </div>
      )}
    </div>
  );
};

export default LandingPage; 