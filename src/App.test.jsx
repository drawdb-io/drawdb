import { BrowserRouter, Routes, Route } from "react-router-dom";

export default function App() {
  return (
    <div>
      <h1>Test App - Working!</h1>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<div>Home Route Working</div>} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}