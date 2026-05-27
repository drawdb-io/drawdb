import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

export default function useNavigateWithParams() {
  const navigate = useNavigate();

  return useCallback(
    (to, options = {}) => {
      navigate(to + window.location.search, options);
    },
    [navigate],
  );
}
