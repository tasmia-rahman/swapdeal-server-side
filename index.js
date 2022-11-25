const express = require('express');
var cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();


const app = express();
const port = process.env.PORT || 5000;

// middle wares
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.aw5zzia.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {

    try {
        const categoriesCollection = client.db('swapdealDB').collection('categories');
        const productsCollection = client.db('swapdealDB').collection('products');

        //Categories
        app.get('/categories', async (req, res) => {
            const query = {}
            const cursor = categoriesCollection.find(query);
            const categories = await cursor.toArray();
            res.send(categories);
        });

        //Products
        app.get('/category/:id', async (req, res) => {
            //get category
            const id = req.params.id;
            const filter = { _id: id };
            const category = await categoriesCollection.findOne(filter);

            //get category based products
            const query = { category: category.name };
            const products = await productsCollection.find(query).toArray();
            res.send(products);
        });
    }
    finally {

    }
}

run().catch(err => console.error(err));

app.get('/', (req, res) => {
    res.send('API running');
})

app.listen(port, () => {
    console.log('Server is running on port', port);
})