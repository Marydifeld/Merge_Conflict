import Navbar from "./Components/Navbar";
import Churn from "./pages/Churn";
import Inicio from "./pages/mainPage";
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

export default function App() {
  return (
    <BrowserRouter>
    <Navbar />
    <Routes>
      <Route path="/churn" element={<Churn />} />
      <Route path="/mainPage" element={<Inicio />} />
    </Routes>
    </BrowserRouter>
  );
}
