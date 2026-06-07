import WarningSign from "../Images/WarningSign.png";
import ClientWarning from "./ClientWarning";
import ChurnPieChart from "./ChurnPieChart";



function Warning({ mockClients,dataGraph }) {
    return(
        <div className="warningContant">
            <div className="warning">
                <div className="warningLeft">
                    <img src={WarningSign} alt="Warning"/>
                </div>
            
                <div className="warningRight">
                    <h1>Warning</h1>
                    <p>The following clients have a high churn risk</p>
                    <div className="client-list">
                        {mockClients.map((client) => (
                            <ClientWarning key={client.id} client={client} />
                            ))}
                    </div>
                </div>
            </div>

            <div className="GraphContainer">
                <div className="graphplaceholder WarningGraph" style={{ width: "600px" }}>
                    <h3>Customer Status</h3>
                <ChurnPieChart data={dataGraph} />
                </div>
            </div>

        </div>
    )
}
export default Warning;