import { useState, useMemo } from "react";
import LineChart from "../Components/LineChart";
import TopRiskSubchannels from "../Components/TopRiskSubchannels";

const PERIOD_OPTIONS = [
  { label: "Last 3 Months", months: 3 },
  { label: "Last 6 Months", months: 6 },
  { label: "Last Year",     months: 12 },
  { label: "All Time",      months: null },
];

const RISK_OPTIONS = [
  { label: "All Customers",  min: 0 },
  { label: "High Risk",      min: 20 },
  { label: "Medium Risk",    min: 10 },
  { label: "Low Risk",       min: 0, max: 10 },
];

function filterByMonths(data, months) {
  if (!months) return data;
  return data.slice(-months);
}

function Graphs({ data1, data2, data3, data4 }) {
  const [periodIdx, setPeriodIdx]  = useState(3); // "All Time" por default
  const [riskIdx, setRiskIdx]      = useState(0); // "All Customers"

  const { months }    = PERIOD_OPTIONS[periodIdx];
  const { min, max }  = RISK_OPTIONS[riskIdx];

  const filtered1 = useMemo(() => filterByMonths(data1, months), [data1, months]);
  const filtered2 = useMemo(() => filterByMonths(data2, months), [data2, months]);
  const filtered3 = useMemo(() => filterByMonths(data3, months), [data3, months]);
  const LOOKER_BASE = "https://datastudio.google.com/embed/reporting/265016e6-821e-480c-b3c5-a2446ccbff5b/page/BKW0F";
  const RISK_FILTER_MAP = {
  0: null,       // All Customers — sin filtro
  1: "alto",
  2: "medio",
  3: "bajo",
};
  function buildLookerUrl(riskIdx) {
  const nivel = RISK_FILTER_MAP[riskIdx];
  if (!nivel) return LOOKER_BASE;

  const params = `{"df_risk":"${nivel}"}`;
  return `${LOOKER_BASE}?params=${params}`;
}
const lookerUrl = useMemo(() => buildLookerUrl(riskIdx), [riskIdx]);

  const filtered4 = useMemo(() => {
    return data4.filter(item => {
      const r = item.riesgo;
      if (max !== undefined) return r >= min && r < max;
      return r >= min;
    });
  }, [data4, min, max]);

  return (
    <div className="graphsSection">
      <div className="graphsFilters">
        <select
          value={periodIdx}
          onChange={e => setPeriodIdx(Number(e.target.value))}
        >
          {PERIOD_OPTIONS.map((opt, i) => (
            <option key={i} value={i}>{opt.label}</option>
          ))}
        </select>

        <select
          value={riskIdx}
          onChange={e => setRiskIdx(Number(e.target.value))}
        >
          {RISK_OPTIONS.map((opt, i) => (
            <option key={i} value={i}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="graphsContainer">
        <div className="graphCard">
          <div className="graphPlaceholder">
            <h3>Monthly Transactions</h3>
            <LineChart
              data={filtered1}
              dataKeyY="transacciones"
              dataKeyX="mes"
            />
          </div>
        </div>

        <div className="graphCard">
          <div className="graphPlaceholder">
            <h3>Risk Map by Territory</h3>
            <iframe
              title="Churn Dashboard"
              width="100%"
              height="300"
              src={lookerUrl}
              frameBorder="0"
              style={{ border: 0 }}
              allowFullScreen
              sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
            />
          </div>
        </div>
      </div>

      <div className="graphsContainer">
        <div className="graphCard">
          <div className="graphPlaceholder">
            <h3>Boxes per Month</h3>
            <LineChart
              data={filtered3}
              dataKeyY="cajas"
              dataKeyX="mes"
            />
          </div>
        </div>

        <div className="graphCard">
          <div className="graphPlaceholder">
            <h3>Top 5 Riskiest Subchannels</h3>
            <TopRiskSubchannels
              data={filtered4}
              dataKeyX="subchannel"
              dataKeyY="riesgo"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Graphs;  