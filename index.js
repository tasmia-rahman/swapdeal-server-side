const express = require('express');
var cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());

app.get('/', (req, res) => {
    res.send('API running');
})

app.listen(port, () => {
    console.log('Server is running on port', port);
})