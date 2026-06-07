import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from "recharts";

function TopRiskSubchannels({ data }) {
  return (
 
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 10, right: 20, left: 80, bottom: 10 }}
        >
          <XAxis
            type="number"
            domain={[0, 30]}
            tickFormatter={(value) => `${value}%`}
          />

          <YAxis
            type="category"
            dataKey="subchannel"
            width={80}
          />

          <Tooltip
            formatter={(value) => [`${value}%`, "Average Churn Risk"]}
          />

          <Bar dataKey="riesgo">
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={
                  index === 0 ? "#e4234a" :
                  index === 1 ? "#e4234ac9" :
                  index === 2 ? "#f04228" :
                  index === 3 ? "#f04328ce" :
                  index === 4 ? "#fe6602" :
                  "#f26a6a"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
  );
}

export default TopRiskSubchannels;