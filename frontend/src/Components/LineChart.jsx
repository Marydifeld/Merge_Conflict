import {
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";

function LineChart({ data, dataKeyY, dataKeyX }) {
  return (
    <div style={{ width: "100%"}}>

      <ResponsiveContainer width="100%" height={300}>
        <RechartsLineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis dataKey={dataKeyX} />

          <YAxis dataKey={dataKeyY} />

          <Tooltip />

          <Line
            type="monotone"
            dataKey={dataKeyY}
            stroke="#e4234a"
            strokeWidth={3}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default LineChart;