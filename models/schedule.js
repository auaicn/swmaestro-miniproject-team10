const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
    conversation_id: {type: Number, required: true},
    date: {type: Date, default: Date.now},
    content : {type: String, default: null},
    link : {type: String, default:null}
});

module.exports = mongoose.model('schedule',scheduleSchema);