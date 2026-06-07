function Graphs() {
    return (
        <div className="graphsSection">
                <div className="graphsFilters">
                    <select>
                        <option>Last 7 Days</option>
                        <option>Last Month</option>
                        <option>Last Quarter</option>
                        <option>Last Year</option>
                    </select>

                    <select>
                        <option>All Customers</option>
                        <option>High Risk</option>
                        <option>Medium Risk</option>
                        <option>Low Risk</option>
                    </select>
            </div>

            <div className="graphsContainer">
                <div className="graphCard">
                    <h3>Churn Trend</h3>
                    <div className="graphPlaceholder">
                        Graph 1
                    </div>
                </div>

                <div className="graphCard">
                    <h3>Risk Distribution</h3>
                    <div className="graphPlaceholder">
                        Graph 2
                    </div>
                </div>
            </div>

        </div>
    );
}

export default Graphs;