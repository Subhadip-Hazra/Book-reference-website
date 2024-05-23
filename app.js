const { MongoClient, ServerApiVersion } = require("mongodb");
const express = require("express");
const cors = require("cors");
const app = express();

const { reset } = require('nodemon');
require('dotenv').config();

app.use(express.json());
app.use(cors());

const userId = process.env.USER_ID;
const password = process.env.PASSWORD;

console.log(userId, "this is my user id", password, "this is my password")

const uri = `mongodb+srv://${userId}:${password}@cluster0.c35skkj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});
const fs = require("fs");


const fetchCard = async (card_Id) => {
    try {
        const data = await fs.promises.readFile("./data.json", "utf8");
        const jsonData = JSON.parse(data);
        console.log("from this function:", card_Id);
        const card = jsonData.cards.find(card => card.id === card_Id);
        // console.log("card data is", card);
        const authorCard = jsonData.bestAuthors.find(authorCard => authorCard.id === card_Id);
        const motivationCard = jsonData.motivation.find(motivationCard => motivationCard.id === card_Id);
        const programmerCard = jsonData.programming.find(programmerCard => programmerCard.id === card_Id);
        const recipeCard = jsonData.recipes.find(recipeCard => recipeCard.id === card_Id);

        return { card, authorCard,motivationCard,programmerCard,recipeCard };
    } catch (error) {
        console.log(error);
        throw error;
    }
};



async function run() {

    try {
        await client.connect();
        const db = client.db("bookdata");
        // All data base collections
        const userRegisterCollection = db.collection("register");
        const userBookCollection = db.collection("userCart");
        const userHelpDesk = db.collection("userContactUs")

        app.post("/register", async (req, res) => {
            const { userName, email, password } = req.body;
            const isVerified = true;
            try {
                const userCheck = await userRegisterCollection.findOne({ email: email, verifed: true });
                if (userCheck) {
                    return res.status(200).json({ success: true, message: "you already register on this email" });
                }
                await userRegisterCollection.insertOne({
                    userName,
                    email,
                    password,
                    isVerified,
                })
                return res.status(200).json({ success: true, message: "Details saved successfully" });
            }
            catch (error) {
                return res.status(500).json({ success: false, message: "Internal server error" });
            }
        })
        app.post("/login", async (req, res) => {
            const { email, password } = req.body;
            try {
                const userLogin = await userRegisterCollection.findOne({ email: email, password: password });
                if (!userLogin) {
                    return res.status(200).json({ success: false, message: "Check your email or password" });
                }
                else {
                    return res.status(200).json({ success: true, message: "Login successfully" });
                }
            }
            catch (error) {
                return res.status(505).json({ success: false, message: "Internal server errr" });
            }
        })

        app.post("/forget-password", async (req, res) => {
            const { email, password } = req.body;
            // console.log(email,password);

            try {
                const checkPassword = await userRegisterCollection.findOne({ email: email, password: password });
                if (checkPassword) {
                    return res.status(200).json({ success: true, message: "same" });
                }
                const userEmailFind = await userRegisterCollection.findOne({ email: email });
                console.log(userEmailFind);
                if (!userEmailFind) {
                    return res.status(200).json({ success: false, message: "We unable to find email" });
                }
                await userRegisterCollection.updateOne(
                    { email: email },
                    { $set: { password: password } }
                )
                return res.status(200).json({ success: true, message: "password updated" });
            }
            catch (error) {
                return res.status(505).json({ success: false, message: "Internal server errr" });
            }
        })

        app.post("/add-cart", async (req, res) => {
            const { card_Id, email } = req.body;
            try {
                const checkAlreadyExist = await userBookCollection.findOne({ card_Id, email });
                if (checkAlreadyExist) {
                    return res.status(200).json({ success: true, message: 'exist' });
                }
                else {
                    await userBookCollection.insertOne({
                        card_Id,
                        email,
                    })
                    return res.status(200).json({ success: true, message: 'book added to cart' })
                }
            }
            catch (error) {
                console.log(error);
                return res.status(500).json({ success: false, message: 'Internal server error' });
            }
        })

        app.get("/search-book/", async (req, res) => {
            const { email } = req.query;
            console.log(email);
            try {
                if (!email) {
                    return res.status(400).json({ success: false, message: 'Email is required' });
                }

                const search = await userBookCollection.find({ email }).toArray();
                if (search.length === 0) {
                    return res.status(200).json({ success: false, message: 'No books found in the cart' });
                }

                const data = [];
                for (const item of search) {
                    const cardId = item.card_Id;
                    console.log(cardId);
                    const { card, authorCard,motivationCard,programmerCard,recipeCard } = await fetchCard(cardId);
                    if (card) {
                        data.push(card);
                    } else if (authorCard) {
                        data.push(authorCard);
                    } else if (motivationCard) {
                        data.push(motivationCard);
                    } else if (programmerCard) {
                        data.push(programmerCard);
                    } else if (recipeCard) {
                        data.push(recipeCard);
                    }
                    else {
                        console.log(`Card with id ${cardId} not found.`);
                    }
                }

                console.log("the data is:", data);
                return res.status(200).json({ success: true, message: 'Data fetched successfully', data });
            } catch (error) {
                console.error(error);
                return res.status(500).json({ success: false, message: 'Internal server error' });
            }
        });

        app.post("/contact-us",async(req,res) =>{
            const {email,name,message} = req.body;
            console.log(message);
            try{
                await userHelpDesk.insertOne({
                    email,
                    name,
                    message,
                })
                return res.status(200).json({success:true,message:'message recived'});
            }
            catch(error){
                return res.status(500).json({success:false,message:'Internal server error'});
            }
        })

        app.post("/delete-cart",async (req,res) => {
            const {card_Id,email} = req.body;
            try{
                const checkExist = await userBookCollection.findOne({card_Id,email});
                if(checkExist){
                    await userBookCollection.deleteOne({
                        card_Id,
                        email,
                    })
                    return res.status(200).json({success:true,message:'deleted successfully'})
                }
            }
            catch(error){
                console.log(error);
                return res.status(500).json({success:false,message:'Internal server error'});
            }
        })



        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    }
    catch (error) {
        console.log("Got a error", error);
        reset();
    }
}
run().catch(console.dir);

const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});