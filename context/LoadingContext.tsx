import React, { createContext, useContext, useState } from 'react';
import LoadingScreen from '@/app/loading'; 

const LoadingContext = createContext({
  setLoading: (loading: boolean) => {},
});



export const LoadingProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoading, setIsLoading] = useState(false);

  const setLoadingWithSafety = (value: boolean) => {
    setIsLoading(value);
    if (value) {
      setTimeout(() => {
        setIsLoading(current => {
          if (current) {
            alert("Connection is slow. Please try again.");
            return false;
          }
          return current;
        });
      }, 10000); 
    }
  };

  return (
    <LoadingContext.Provider value={{ setLoading: setLoadingWithSafety }}>
      {children}
      {isLoading && <LoadingScreen />}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => useContext(LoadingContext);