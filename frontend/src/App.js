// App.js
import React, { useState } from "react";
import ExercisesPage from "./components/ExercisesPage";
import HomePage from "./components/HomePage";
import LandingPage from "./components/LandingPage";

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
        <nav style={{ marginBottom: "20px" }}>
          <button onClick={goToHomePage} style={{ marginRight: "10px" }}>Accueil</button>
          <button onClick={goToExercisesPage}>Exercices</button>
          <button onClick={goToLandingPage} style={{ marginLeft: "20px" }}>Déconnexion</button>
        </nav>
      )}

      {/* Affichage conditionnel des pages */}
      {currentPage === "landing" && <LandingPage onLoginClick={goToHomePage} onSignupClick={goToHomePage} />} {/* Pour l'instant, login/signup redirigent vers home */}
      {currentPage === "home" && <HomePage />}
      {currentPage === "exercises" && <ExercisesPage />}
    </div>
  );
}

export default App;
