function KPI({ data }) {
  return (
    <div className="kpi">

      <div className="kpiContainer">
        <h1>Average Churn Risk</h1>
        <h2>{data.probChurn}%</h2>
      </div>

      <div className="kpiContainer second">
        <h1>Historical Churn Rate</h1>
        <h2>{data.tasaChurn}%</h2>
      </div>

      <div className="kpiContainer third">
        <h1>High Risk Clients</h1>
        <h2>{data.clientesRiesgo}</h2>
      </div>

    </div>
  );
}

export default KPI;