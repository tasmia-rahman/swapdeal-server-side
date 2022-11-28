const express = require('express');
var cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

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
        const usersCollection = client.db('swapdealDB').collection('users');
        const bookingsCollection = client.db('swapdealDB').collection('bookings');
        const paymentsCollection = client.db('swapdealDB').collection('payments');

        //Categories
        app.get('/categories', async (req, res) => {
            const query = {}
            const categories = await categoriesCollection.find(query).toArray();
            res.send(categories);
        });

        //Category products
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

        //Seller's products
        app.get('/products/:email', async (req, res) => {
            const email = req.params.email;
            const query = { sellerEmail: email };
            const products = await productsCollection.find(query).toArray();
            res.send(products);

        });

        app.post('/products', async (req, res) => {
            const product = req.body;
            product.date = Date();
            const result = await productsCollection.insertOne(product);
            res.send(result);
        });

        // app.get('/products/:id', async (req, res) => {
        //     const id = req.params.id;
        //     console.log(id);
        //     const filter = { _id: ObjectId(id) };
        //     const product = await productsCollection.findOne(filter);
        //     console.log(product);
        //     if (product.sale_status === 'advertised') {
        //         const message = "You advertised the product already!";
        //         return res.send({ acknowledged: false, message });
        //     }
        //     // res.send({ acknowledged: true});
        // });

        app.put('/products/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    sale_status: 'advertised'
                }
            }
            const result = await productsCollection.updateOne(filter, updatedDoc, options);
            res.send(result);

        });

        app.delete('/products/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await productsCollection.deleteOne(filter);
            res.send(result);
        })

        app.put('/product/:productName', async (req, res) => {
            const productName = req.params.productName;
            const filter = { name: productName };
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    sale_status: 'paid'
                }
            }
            const result = await productsCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        });

        //Advertised Products
        app.get('/advertisedProducts', async (req, res) => {
            const query = { sale_status: 'advertised' };
            const products = await productsCollection.find(query).toArray();
            res.send(products);
        })

        //Bookings
        app.get('/bookings/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const bookings = await bookingsCollection.find(query).toArray();
            res.send(bookings);
        });

        app.get('/booking/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const booking = await bookingsCollection.findOne(query);
            res.send(booking);
        })

        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            const query = {
                email: booking.email,
                productName: booking.productName
            }
            const alreadyBooked = await bookingsCollection.find(query).toArray();
            if (alreadyBooked.length) {
                const message = "It's already booked!";
                return res.send({ acknowledged: false, message });
            }
            const result = await bookingsCollection.insertOne(booking);
            res.send(result);
        });

        //Users
        app.post('/users', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const existingUser = await usersCollection.find(filter).toArray();
            if (existingUser.length) {
                const message = "User already exists!";
                return res.send({ acknowledged: false, message });
            }

            const result = await usersCollection.insertOne(user);
            res.send(result);
        });

        //User role
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            if (user.role === 'seller') {
                sellerInfo = user;
            }
            else {
                sellerInfo = {};
            }

            if (user.role === 'buyer') {
                buyerInfo = user;
            }
            else {
                buyerInfo = {};
            }
            res.send({ sellerInfo, buyerInfo, isAdmin: user?.role === 'admin', isSeller: user?.role === 'seller', isBuyer: user?.role === 'buyer' });
        })

        app.delete('/users/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await usersCollection.deleteOne(filter);
            res.send(result);
        })

        //Buyers
        app.get('/buyers', async (req, res) => {
            const query = { role: 'buyer' };
            const buyers = await usersCollection.find(query).toArray();
            res.send(buyers);
        })

        //Sellers
        app.get('/sellers', async (req, res) => {
            const query = { role: 'seller' };
            const sellers = await usersCollection.find(query).toArray();
            res.send(sellers);
        })

        // Verify seller
        app.put('/sellers/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    status: 'verified'
                }
            }
            const result = await usersCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        });

        //Payment
        app.post('/create-payment-intent', async (req, res) => {
            const booking = req.body;
            const price = booking.price;
            console.log(price);
            const amount = Math.round(price * 100);

            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                "payment_method_types": [
                    "card"
                ]
            });
            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        });

        app.post('/payments', async (req, res) => {
            const payment = req.body;
            const result = await paymentsCollection.insertOne(payment);
            const id = payment.bookingId;
            const filter = { _id: ObjectId(id) }
            const updatedDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId
                }
            }
            const updatedResult = await bookingsCollection.updateOne(filter, updatedDoc)
            res.send(result);
        })

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