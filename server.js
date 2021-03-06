var iccuAccessToken = "access-development-5c1f0a50-38e4-4815-b6ce-c4953760d635";
var iccuItemID = "ALnaJQVAZKu0rJnd450asQA1Yp7vQYT6OxqEk";

var americaFirstAccessToken = "access-development-7ac3e1c0-579f-4ecc-b478-9c738ba98beb";
var americaFirstItemID = "oyNPKMk9LjTvzkZNmoNzIyObazjX7gtBMmZpp"

var deseretFirstAccessToken = "access-development-0b2cf49e-9fca-4c33-ae4f-bd52b0b5962e"
var deseretFirstItemID = "ZqRE0bo3yoUPEdgD0XQBi8JnMqJne4Fb3gwpr"

// fs library
const fs = require('fs');

var file = fs.readFileSync('items.json');
var item = JSON.parse(file);
var itemID = item[1]['Item ID']
var deseretFirstAccessToken = item[1]['Acess Token']
console.log(itemID);
console.log(deseretFirstAccessToken);

// Using Express
const express = require('express');
const app = express();
app.use(express.json());
const cors = require('cors')
const corsOptions ={
  origin:'*',
  credentials:true,
  optionSuccessStatus:200,
}
app.use(cors(corsOptions));
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

// const ipfilter = require('express-ipfilter').IpFilter
// const ips = ['127.0.0.1', '52.21.26.131', '52.21.47.157', '52.41.247.19', '52.88.82.239']
// app.use(ipfilter(ips))

var AccessControl = require('express-ip-access-control');

var options = {
	mode: 'deny',
	denys: [],
	allows: [],
	forceConnectionAddress: false,
	log: function(clientIp, access) {
		console.log(clientIp + (access ? ' accessed.' : ' denied.'));
	},

	statusCode: 401,
	redirectTo: '',
	message: 'Unauthorized'
};

app.use(AccessControl(options));


const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');

const configuration = new Configuration({
    basePath: PlaidEnvironments['development'],
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': '6144b210d9409600107b5f46',
        'PLAID-SECRET': '95f7393cbfd85793fa1a16c25ae223',
      },
    },
  });

const plaidClient = new PlaidApi(configuration);

// app.get('/', (req, res) => {
//   res.send('Hello World');
// });

app.post('/api/create_link_token', async function(req, res) {
  var request = {
    user: {
        client_user_id: 'user-id',
    },
    client_name: 'Plaid Test App',
    products: ['transactions'],
    country_codes: ['US'],
    language: 'en',
    webhook: 'http://www.bradenwhalefinance.com.s3-website-us-west-1.amazonaws.com',
    account_filters: {
        depository: {
            account_subtypes: ['checking', 'savings'],
        },
    },
  };
    try {
        const createTokenResponse = await plaidClient.linkTokenCreate(request);
        res.json(createTokenResponse.data);
        console.log('createLinkToken function called')
        // res.send("POST request called");
        
      } catch (error) {
        console.log('an error occured calling createLinkToken function')
      }
});

app.post(
  '/api/exchange_public_token',
  async function (request, response, next) {
    const publicToken = request.body.public_token;
    console.log(publicToken);
    console.log(request.body);
    try {
      console.log('Exchange function called');
      const response = await plaidClient.itemPublicTokenExchange({
        public_token: publicToken,
      });
      let accessToken = response.data.access_token;
      let itemID = response.data.item_id;
      let item = {"Item ID": itemID, "Acess Token": accessToken}
      var data = fs.readFileSync('items.json');
      var json = JSON.parse(data);
      json.push(item);
      fs.writeFile('items.json', JSON.stringify(json), (err) => {
        if (err) {
          throw err;
        }
        console.log("Item is saved.")
        console.log(accessToken);
        console.log(itemID);
      });
            
    } catch (error) {
      // handle error
      console.log('error occured with exchanging public token');
    }
  },
);

app.listen(3000, function(err) {
  if(err) console.log(err);
  console.log("Server listening on PORT 3000");
});

// Pull transactions for a date range
app.post('/api/get_transactions', async function(req, res) {
  var request = {
    access_token: deseretFirstAccessToken,
    start_date: '2021-12-25',
    end_date: '2021-12-25',
    options: {
        count: 50,
        offset: 0,
    },
  };
  try {
    const response = await plaidClient.transactionsGet(request);
    const transactions = response.data.transactions;
    const data = JSON.stringify(transactions);
    
    if (transactions.length <= 50) {
      // write JSON string to a file
      fs.writeFile('newTransactions.json', data, (err) => {
        if (err) {
          throw err;
        }
        console.log("New Transactions JSON data is saved.");
      });
    }
    else {
      // write JSON string to a file
      fs.writeFile('transactions.json', data, (err) => {
        if (err) {
          throw err;
        }
        console.log("Transaction JSON data is saved.");
      });
    }

    res.json(transactions);
    // console.log(transactions);
  
  } catch(err) {
  // handle error
  }
});

app.post('/api/notifications', async function (req, res) {
try {
  const notificationRequestItems = req.body.notificationRequestItems;
  res.status(200).send('OK');
  console.log("Notification request items below:");
  console.log(notificationRequestItems);
} catch (error) {
  console.log("An error occured during webhook notification");
}
})

async function searchInstitution(insitutionID) {
  const request = {
    institution_id: insitutionID,
    country_codes: ['US'],
  };
  try {
    const response = await plaidClient.institutionsGetById(request);
    const institution = response.data.institution;
    console.log(institution);
  } catch (error) {
    // Handle error
  }
}

var mysql = require('mysql');

var connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '3r@Den32',
  database: 'bigben'
});
connection.connect();

var article = {
  author: 'Braden Potter',
  title: 'Node tutorial',
  body: 'foo bar'
};

var query = connection.query('insert into articles set ?', article, function (err, result){
  if (err) {
    console.error(err);
    return
  }
  console.error(result);
});
