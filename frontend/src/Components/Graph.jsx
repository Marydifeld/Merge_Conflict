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
  { label: "All Customers", min: 0 },
  { label: "High Risk",     min: 20 },
  { label: "Medium Risk",   min: 10 },
  { label: "Low Risk",      min: 0, max: 10 },
];

const RISK_FILTER_MAP = { 0: null, 1: "alto", 2: "medio", 3: "bajo" };

const LOOKER_BASE = "https://datastudio.google.com/embed/reporting/265016e6-821e-480c-b3c5-a2446ccbff5b/page/BKW0F";

// prob_churn_avg * 100 de kpis_por_subchannel
const SUBCHANNEL_RISK = {
  "Hogares":                          27.18,
  "Tienda orgánica":                  21.00,
  "Licorería":                        18.24,
  "Tiendas de carne/pollo/pescado":   16.55,
  "Verdulería":                       15.37,
  "Mayorista":                        12.58,
  "Abarrotes y bodegas":              12.28,
  "Tortillería":                      10.36,
  "Kiosco":                           10.31,
  "Minisuper":                         6.65,
  "Farmacia":                          2.46,
  "Panadería":                         0.16,
  "Proximidad":                        0.00,
};

const TOTAL_SUBCHANNELS = Object.keys(SUBCHANNEL_RISK).length;

function filterByMonths(data, months) {
  if (!months) return data;
  return data.slice(-months);
}

function buildLookerUrl(riskIdx) {
  const nivel = RISK_FILTER_MAP[riskIdx];
  if (!nivel) return LOOKER_BASE;
  return `${LOOKER_BASE}?params={"df_risk":"${nivel}"}`;
}

function Graphs({ data1, data2, data3, data4, serieSubchannel }) {
  const [periodIdx, setPeriodIdx] = useState(3);
  const [riskIdx, setRiskIdx]     = useState(0);

  const { months }   = PERIOD_OPTIONS[periodIdx];
  const { min, max } = RISK_OPTIONS[riskIdx];

  // Subchannels que pasan el filtro de riesgo
  const subchannelsFiltrados = useMemo(() => {
    return Object.entries(SUBCHANNEL_RISK).filter(([_, r]) => {
      if (max !== undefined) return r >= min && r < max;
      return r >= min;
    }).map(([sc]) => sc);
  }, [min, max]);

  // Transacciones: exacto para los que tienen serie, proporcional para los que no
  const filtered1 = useMemo(() => {
    const byTime = filterByMonths(data1, months);
    if (riskIdx === 0) return byTime;

    const conSerie  = subchannelsFiltrados.filter(sc => serieSubchannel[sc]);
    const sinSerie  = subchannelsFiltrados.filter(sc => !serieSubchannel[sc]);
    const sinRatio  = sinSerie.length / TOTAL_SUBCHANNELS;

    return byTime.map(({ mes, transacciones }) => {
      const fromSerie = conSerie.reduce((sum, sc) => {
        const entry = (serieSubchannel[sc] || []).find(e => e.mes === mes);
        return sum + (entry ? entry.transacciones : 0);
      }, 0);
      const fromGlobal = Math.round(transacciones * sinRatio);
      return { mes, transacciones: fromSerie + fromGlobal };
    });
  }, [data1, months, riskIdx, subchannelsFiltrados, serieSubchannel]);

  // Cajas: siempre proporcional (no hay serie por subchannel)
  const filtered3 = useMemo(() => {
    const byTime = filterByMonths(data3, months);
    if (riskIdx === 0) return byTime;

    const ratio = subchannelsFiltrados.length / TOTAL_SUBCHANNELS;
    return byTime.map(item => ({
      ...item,
      cajas: +(item.cajas * ratio).toFixed(2),
    }));
  }, [data3, months, riskIdx, subchannelsFiltrados]);

  const filtered2 = useMemo(() => filterByMonths(data2, months), [data2, months]);

  const filtered4 = useMemo(() => {
    return data4.filter(item => {
      const r = item.riesgo;
      if (max !== undefined) return r >= min && r < max;
      return r >= min;
    });
  }, [data4, min, max]);

  const lookerUrl = useMemo(() => buildLookerUrl(riskIdx), [riskIdx]);

  return (
    <div className="graphsSection">
      <div className="graphsFilters">
        <select value={periodIdx} onChange={e => setPeriodIdx(Number(e.target.value))}>
          {PERIOD_OPTIONS.map((opt, i) => (
            <option key={i} value={i}>{opt.label}</option>
          ))}
        </select>

        <select value={riskIdx} onChange={e => setRiskIdx(Number(e.target.value))}>
          {RISK_OPTIONS.map((opt, i) => (
            <option key={i} value={i}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="graphsContainer">
        <div className="graphCard">
          <div className="graphPlaceholder">
            <h3>Monthly Transactions</h3>
            <LineChart data={filtered1} dataKeyY="transacciones" dataKeyX="mes" />
          </div>
        </div>

        <div className="graphCard">
          <div className="graphPlaceholder">
            <h3>Risk Map by Territory</h3>
            <iframe
              key={lookerUrl}
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
            <LineChart data={filtered3} dataKeyY="cajas" dataKeyX="mes" />
          </div>
        </div>

        <div className="graphCard">
          <div className="graphPlaceholder">
            <h3>Top 5 Riskiest Subchannels</h3>
            <TopRiskSubchannels data={filtered4} dataKeyX="subchannel" dataKeyY="riesgo" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Graphs;