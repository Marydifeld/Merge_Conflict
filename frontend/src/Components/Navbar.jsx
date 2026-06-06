import Logo from "../Images/Logo.png";

function Navbar() {
    return (
      <nav className="navbar">
        <img src={Logo} alt="Logo"/>
        <div className="navbarButtons">
          <button>Inicio</button>
          <button>Churn</button>
          <button>Home</button>
        </div>
      </nav>
    );
  }
  
  export default Navbar;