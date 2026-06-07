import WarningSign from "../Images/WarningSign.png";
import ClientWarning from "./ClientWarning";

const mockClients = [
  { id: 1, name: 'Client A', risk: 90 },
  { id: 2, name: 'Client B', risk: 72 },
  { id: 3, name: 'Client C', risk: 55 }
]

function Warning(){
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
                hola
                </div>  

        </div>
    )
}
export default Warning;