import express from 'express';
const app = express();

import { adminRouter } from './routes/admin.js';
import { usersRouter } from './routes/users.js';


app.use(express.json());

// Allow cross-origin requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, username, password, token');
  next();
})

app.use('/admin', adminRouter );
app.use('/users', usersRouter );

//Invalidate other paths
function pageNotFound(req, res) {
  res.status(404).json({ status:false, message: 'Invalid request'});
}
app.get('*', (req, res) => {
  pageNotFound(req, res);
});
app.post('*', (req,res) => {
  pageNotFound(req, res);
});
app.put('*', (req,res) => {
  pageNotFound(req, res);
});
app.delete('*', (req,res) => {
  pageNotFound(req, res);
});

app.listen(3000, () => {
  console.log('Server is listening on port 3000');
});
