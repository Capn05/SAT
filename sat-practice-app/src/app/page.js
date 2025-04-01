import React from 'react';
import Link from 'next/link';

const Component = () => {


  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      padding: '0 20px',
      textAlign: 'center'
    }}>
      <img 
        src="/landing/assets/images/logo.png" 
        alt="Brill Logo" 
        style={{
          height: '48px',
          width: 'auto',
          marginBottom: '1.5rem'
        }}
      />
      <p style={{
        fontSize: '1.25rem',
        marginBottom: '2rem',
        color: 'black',
        maxWidth: '400px'
      }}>
        AI powered Standardized Test pro
      </p>
      <Link href="/login">
        <button 
          style={{
            backgroundColor: '#65a30d',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '16px 32px',
            fontSize: '1.125rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'background-color 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          Log In / Sign Up
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            style={{marginLeft: '8px', width: '20px', height: '20px'}}
          >
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </button>
      </Link>
    </div>
  );
};

export default Component;