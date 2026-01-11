import React from 'react';
import '../styles/NotFound.css';

const NotFound: React.FC = () => {
  // Function to redirect to the main app
  const redirectToMain = () => {
    window.location.href = '/';
  };

  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <img 
          src="/assets/loantube-n-logo.svg" 
          alt="LoanTube" 
          className="not-found-logo"
        />
        <h1>404</h1>
        <h2>Partner Not Found</h2>
        <p>The partner you're looking for doesn't exist or may have been removed.</p>
        <button onClick={redirectToMain} className="redirect-button">
          Go to LoanTube
        </button>
      </div>
    </div>
  );
};

export default NotFound; 