import Searchbar from '../Components/Searchbar'
import ClientCard from '../Components/ClientCard'
import '../churn_styles.css'

const mockClients = [
  { id: 1, name: 'Client A', risk: 90 },
  { id: 2, name: 'Client B', risk: 72 },
  { id: 3, name: 'Client C', risk: 55 },
  { id: 4, name: 'Client D', risk: 38 },
]

function churn() {
  return (
    <div id="churn-page">
      <div className="churn-header">
        <h1>Churn</h1>
        <p>Look up clients at risk of churn</p>
      </div>

      <Searchbar />

      <div className="client-list">
        {mockClients.map((client) => (
          <ClientCard key={client.id} client={client} />
        ))}
      </div>
    </div>
  )
}
export default churn