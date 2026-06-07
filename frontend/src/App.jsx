import Navbar from "./Components/Navbar";
import Churn from "./pages/Churn";
import Inicio from "./pages/mainPage";
import ClientDetails from "./pages/ClientDetails";
import { BrowserRouter, Routes, Route } from 'react-router-dom';

export default function App() {
  return (
    <BrowserRouter>
    <Navbar />
    <Routes>
      <Route path="/" element={<Inicio />} />
      <Route path="/churn" element={<Churn />} />
      <Route path="/mainPage" element={<Inicio />} />
      <Route path="/details/:clientId" element={<ClientDetails />} />
    </Routes>
    </BrowserRouter>
  );
}

