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
    setShowSignup(false);
    if (!showLogin) {
      setLoginEmail('');
      setLoginPassword('');
    }
  };

  const toggleSignup = () => {
    setShowSignup(!showSignup);
    setShowLogin(false);
    if (!showSignup) {
      setSignupEmail('');
      setSignupPassword('');
      setSignupConfirmPassword('');
    }
  };

  const handleLoginEmailChange = (e) => setLoginEmail(e.target.value);
  const handleLoginPasswordChange = (e) => setLoginPassword(e.target.value);
  const handleSignupEmailChange = (e) => setSignupEmail(e.target.value);
  const handleSignupPasswordChange = (e) => setSignupPassword(e.target.value);
  const handleSignupConfirmPasswordChange = (e) => setSignupConfirmPassword(e.target.value);

  return (
    <div className="flex flex-col items-center justify-center" style={{ minHeight: "100vh", padding: "60px" }}>
      <div className="card" style={{ 
        width: "100%", 
        maxWidth: "1600px", 
        padding: "80px",
        display: "flex",
        flexDirection: "column",
        gap: "60px"
      }}>
        <div className="text-center">
          <h1 className="title" style={{ fontSize: "5em", marginBottom: "30px" }}>Éloquence</h1>
          <p className="text-center" style={{ fontSize: "2.2em", color: "var(--text-color)" }}>
            Améliorez votre éloquence et votre prise de parole en public
          </p>
        </div>
        
        <div className="flex gap-8" style={{ marginBottom: "60px", justifyContent: "center" }}>
          <button 
            onClick={toggleLogin} 
            className="action-button"
            style={{ 
              backgroundColor: showLogin ? "var(--accent-color)" : "var(--primary-color)",
              padding: "25px 50px",
              fontSize: "1.6em",
              width: "auto",
              minWidth: "250px"
            }}
          >
            Se connecter
          </button>
          <div style={{ width: "60px" }}></div>
          <button 
            onClick={toggleSignup} 
            className="action-button"
            style={{ 
              backgroundColor: showSignup ? "var(--accent-color)" : "var(--primary-color)",
              padding: "25px 50px",
              fontSize: "1.6em",
              width: "auto",
              minWidth: "250px"
            }}
          >
            S'inscrire
          </button>
        </div>

        {showLogin && (
          <div className="card" style={{ width: "100%", padding: "60px" }}>
            <div className="flex gap-30">
              <div style={{ flex: 1 }}>
                <h3 className="subtitle" style={{ fontSize: "2.8em", marginBottom: "40px" }}>Se connecter</h3>
                <p style={{ fontSize: "1.4em", color: "var(--text-color)", marginBottom: "40px" }}>
                  Accédez à votre espace personnel pour suivre votre progression et améliorer votre éloquence.
                </p>
              </div>
              <div style={{ flex: 1 }}>
                <form onSubmit={(e) => { e.preventDefault(); onLoginClick(); }}>
                  <div className="mb-8">
                    <label style={{ display: "block", marginBottom: "15px", fontSize: "1.4em" }}>Email:</label>
                    <input 
                      type="email" 
                      value={loginEmail} 
                      onChange={handleLoginEmailChange}
                      required
                      style={{ padding: "20px", fontSize: "1.3em", width: "100%" }}
                    />
                  </div>
                  <div className="mb-8">
                    <label style={{ display: "block", marginBottom: "15px", fontSize: "1.4em" }}>Mot de passe:</label>
                    <input 
                      type="password" 
                      value={loginPassword} 
                      onChange={handleLoginPasswordChange}
                      required
                      style={{ padding: "20px", fontSize: "1.3em", width: "100%" }}
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="action-button"
                    style={{ 
                      width: "100%",
                      padding: "20px",
                      fontSize: "1.4em",
                      marginTop: "30px"
                    }}
                  >
                    Connexion
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {showSignup && (
          <div className="card" style={{ width: "100%", padding: "60px" }}>
            <div className="flex gap-30">
              <div style={{ flex: 1 }}>
                <h3 className="subtitle" style={{ fontSize: "2.8em", marginBottom: "40px" }}>S'inscrire</h3>
                <p style={{ fontSize: "1.4em", color: "var(--text-color)", marginBottom: "40px" }}>
                  Créez votre compte pour commencer votre parcours d'amélioration de l'éloquence.
                </p>
              </div>
              <div style={{ flex: 1 }}>
                <form onSubmit={(e) => { e.preventDefault(); onSignupClick(); }}>
                  <div className="mb-8">
                    <label style={{ display: "block", marginBottom: "15px", fontSize: "1.4em" }}>Email:</label>
                    <input 
                      type="email" 
                      value={signupEmail} 
                      onChange={handleSignupEmailChange}
                      required
                      style={{ padding: "20px", fontSize: "1.3em", width: "100%" }}
                    />
                  </div>
                  <div className="mb-8">
                    <label style={{ display: "block", marginBottom: "15px", fontSize: "1.4em" }}>Mot de passe:</label>
                    <input 
                      type="password" 
                      value={signupPassword} 
                      onChange={handleSignupPasswordChange}
                      required
                      style={{ padding: "20px", fontSize: "1.3em", width: "100%" }}
                    />
                  </div>
                  <div className="mb-8">
                    <label style={{ display: "block", marginBottom: "15px", fontSize: "1.4em" }}>Confirmer mot de passe:</label>
                    <input 
                      type="password" 
                      value={signupConfirmPassword} 
                      onChange={handleSignupConfirmPasswordChange}
                      required
                      style={{ padding: "20px", fontSize: "1.3em", width: "100%" }}
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="action-button"
                    style={{ 
                      width: "100%",
                      padding: "20px",
                      fontSize: "1.4em",
                      marginTop: "30px"
                    }}
                  >
                    Inscription
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LandingPage; 