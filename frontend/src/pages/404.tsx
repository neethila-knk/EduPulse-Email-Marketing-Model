import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/UI/Button';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <main className="grid min-h-screen place-items-center bg-gray-50 px-6 py-24 sm:py-32 lg:px-8">
      <div className="text-center">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-40 h-40 mx-auto text-gray-400">
          <path fill="currentColor" d="M256,16C123.452,16,16,123.452,16,256S123.452,496,256,496,496,388.548,496,256,388.548,16,256,16ZM403.078,403.078a207.253,207.253,0,1,1,44.589-66.125A207.332,207.332,0,0,1,403.078,403.078Z"></path>
          <rect width="176" height="32" x="168" y="320" fill="currentColor"></rect>
          <polygon fill="currentColor" points="210.63 228.042 186.588 206.671 207.958 182.63 184.042 161.37 162.671 185.412 138.63 164.042 117.37 187.958 141.412 209.329 120.042 233.37 143.958 254.63 165.329 230.588 189.37 251.958 210.63 228.042"></polygon>
          <polygon fill="currentColor" points="383.958 182.63 360.042 161.37 338.671 185.412 314.63 164.042 293.37 187.958 317.412 209.329 296.042 233.37 319.958 254.63 341.329 230.588 365.37 251.958 386.63 228.042 362.588 206.671 383.958 182.63"></polygon>
        </svg>
        <p className="text-base font-semibold text-green-600 mt-6">404</p>
        <h1 className="mt-4 text-5xl font-semibold tracking-tight text-balance text-gray-900 sm:text-7xl">
          Page not found
        </h1>
        <p className="mt-6 text-lg font-medium text-pretty text-gray-500 sm:text-xl/8">
          Sorry, we couldn't find the page you're looking for.
        </p>
        <div className="mt-5 flex items-center justify-center gap-x-6">
          <Button 
            variant="primary"
            size="md"
            onClick={() => navigate('/')}
          >
            Go back home
          </Button>
        </div>
      </div>
    </main>
  );
};

export default NotFound;