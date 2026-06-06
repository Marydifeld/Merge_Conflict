const ClientSchema = new mongoose.Schema({
    customerId: {
        type: String,
        required: true,
    },
    territory_d: {
        type: String,
        required: true,
    },
    comercial_subchannel_d: {
        type: String,
        required: true,
    },
    
    rtm_customer_size_d: {
        type: String,
        required: true,
    }, 
});

export default mongoose.model('Client', ClientSchema);