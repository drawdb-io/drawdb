import { useState, useEffect } from 'react';
import { useEventListener } from 'usehooks-ts';

export default function useFullscreen() {
  const [value, setValue] = useState(() => 
    document.fullscreenElement === document.documentElement
  );

  useEffect(() => {
    // Function to handle fullscreen change events
    const handleFullscreenChange = () => {
      setValue(document.fullscreenElement === document.documentElement);
    };

    // Add event listener for fullscreen changes
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    // Cleanup event listener on component unmount
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return value;
}
