import Kpi from "../Components/KPI";
import Warning from "../Components/Warning";
import ClientWarning from "../Components/ClientWarning";
import Graph from "../Components/Graph";
import data from "../data/dashboard_data.json";
import '../styles.css'

const mockClients=[
    { id: 1, name: 'Client A', risk: 90 },
    { id: 2, name: 'Client B', risk: 72 },
    { id: 3, name: 'Client C', risk: 55 }
];
const seriesGlobal = data.serie_tiempo_global.map(item => ({
  mes: item.mes,       
  transacciones: item.transacciones 
}));

const mapaRiesgo = data.mapa_riesgo_territorio.map(item => ({
  territorio: item.territorio,
  riesgo: item.nivel_riesgo_zona
}));

const clientesActivos = data.serie_tiempo_global.map(item => ({
  mes: item.mes,
  clientes_activos: item.clientes_activos
}));

const cajasMes = data.serie_tiempo_global.map(item => ({
  mes: item.mes,
  cajas: item.cajas
}));

const kpiData = {
  probChurn: (data.kpis_globales.prob_churn_promedio * 100).toFixed(2),
  tasaChurn: data.kpis_globales.tasa_churn_historica_pct,
  clientesRiesgo: data.kpis_globales.en_riesgo_alto_muestra
};

const top5Subchannels = (data.kpis_por_subchannel || [])
  .slice() // copy
  .sort((a, b) => b.prob_churn_avg - a.prob_churn_avg)
  .slice(0, 5)
  .map(item => ({
    subchannel: item.subchannel,
    riesgo: +(item.prob_churn_avg * 100).toFixed(2)
  }));

const churnData = [
  {
    name: "Churned",
    value: data.kpis_globales.ya_churnaron_universo
  },
  {
    name: "Active",
    value:
      data.kpis_globales.total_clientes_universo -
      data.kpis_globales.ya_churnaron_universo
  }
];


function Inicio() {
    return (
        <div id="main-page">
            <h1 className="mainPage">Inicio</h1>
            <Kpi data={kpiData} />
            <Warning mockClients={mockClients} dataGraph={churnData} />
            <Graph data1={seriesGlobal} data2={clientesActivos} data3={cajasMes} data4={top5Subchannels} />
        </div>
    );
}

export default Inicio;