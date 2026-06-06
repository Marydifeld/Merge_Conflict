import Logo from "../Images/Logo.png";
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

function Navbar() {
    return (
      <nav className="navbar">
        <img src={Logo} alt="Logo"/>
        <div className="navbarButtons">
          <Link to="/mainPage">Main Page</Link>
          <Link to="/churn">Churn</Link>
          <Link to="/solutions">Solutions</Link>
        </div>
      </nav>
    );
  }
  
  export default Navbar;