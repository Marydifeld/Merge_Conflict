import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from "recharts";

const COLORS = ["#e4234a", "#fe6602"];

function ChurnPieChart({ data }) {
  return (
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            outerRadius={100}
            label={({ percent }) =>
              `${(percent * 100).toFixed(1)}%`
            }
          >
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>

          <Tooltip
            formatter={(value) =>
              value.toLocaleString()
            }
          />

          <Legend />
        </PieChart>
      </ResponsiveContainer>
  );
}

export default ChurnPieChart;