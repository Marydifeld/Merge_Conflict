import mongoose from "mongoose";

const ClientSchema = new mongoose.Schema({
    customer_id: {
        type: String,
        required: true,
    },
    calmonth: {
        type: String,
        required: true,
    },
    num_transacciones: {
        type: Number,
        required: true,
    },
    uni_boxes_sold_m: {
        type: Number,
        required: true,
    },
    target: {
        type: Number,
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
    num_coolers: {
        type: Number,
        required: true,
    },
    num_doors: {
        type: Number,
        required: true,
    },
    estado: {
        type: String,
        required: true,
    },
    prob_churn: {
        type: Number,
        required: true,
    },
    nivel_riesgo: {
        type: String,
        required: true,
    },
    razones: {
        type: String,
        required: true,
    },
    propuestas: {
        type: String,
        required: true,
    },

});

export default mongoose.model('Client', ClientSchema);