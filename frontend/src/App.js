// App.js
import React, { useState } from "react";
import ExercisesPage from "./components/ExercisesPage";
import HomePage from "./components/HomePage";
import LandingPage from "./components/LandingPage";
import "./index.css";

function App() {
  const [currentPage, setCurrentPage] = useState("landing"); // 'landing', 'home', 'exercises'

  const goToHomePage = () => {
    setCurrentPage("home");
  };

  const goToExercisesPage = () => {
    setCurrentPage("exercises");
  };

  const goToLandingPage = () => {
    setCurrentPage("landing");
  };

  return (
    <div className="app">
      {/* Navigation (simple boutons pour l'exemple) */}
      {currentPage !== "landing" && (
        <nav className="navbar">
          <div className="navbar-content">
            <h1 style={{ color: "var(--primary-color)", margin: 0 }}>Éloquence</h1>
            <div className="nav-buttons">
              <button onClick={goToHomePage}>Accueil</button>
              <button onClick={goToExercisesPage}>Exercices</button>
              <button onClick={goToLandingPage} style={{ backgroundColor: "var(--danger-color)" }}>
                Déconnexion
              </button>
            </div>
          </div>
        </nav>
      )}

      {/* Affichage conditionnel des pages */}
      <div className="container">
        {currentPage === "landing" && <LandingPage onLoginClick={goToHomePage} onSignupClick={goToHomePage} />} {/* Pour l'instant, login/signup redirigent vers home */}
        {currentPage === "home" && <HomePage />}
        {currentPage === "exercises" && <ExercisesPage />}
      </div>
    </div>
  );
}

export default App;
