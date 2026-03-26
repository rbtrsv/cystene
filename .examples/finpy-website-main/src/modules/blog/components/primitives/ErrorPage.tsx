import React from 'react';

interface ErrorPageProps {
  statusCode: number;
}

const ErrorPage: React.FC<ErrorPageProps> = ({ statusCode }) => {
  let message = 'An error occurred';
  
  switch (statusCode) {
    case 404:
      message = 'Page Not Found';
      break;
    case 500:
      message = 'Internal Server Error';
      break;
    default:
      message = 'An unexpected error has occurred';
  }

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>{statusCode}: {message}</h1>
    </div>
  );
};

export default ErrorPage;
