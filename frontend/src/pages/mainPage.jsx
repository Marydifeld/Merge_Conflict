import Kpi from "../Components/KPI";
import Warning from "../Components/Warning";
import ClientWarning from "../Components/ClientWarning";
import Graph from "../Components/Graph";
import '../styles.css'

function Inicio() {
    return (
        <body>
        <div id="main-page">
            <h1 className="mainPage">Inicio</h1>
            <Kpi />
            <Warning />
            <Graph />
        </div>
        </body>
    );
}

export default Inicio;