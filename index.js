import { createClient } from 'redis';
import express from 'express';
import util from 'util';

const client = createClient({
	password: 'R1xncO3QkVY1mLJFjr1ycC19eyO8M19O',
	socket: {
		host: 'redis-16890.c322.us-east-1-2.ec2.cloud.redislabs.com',
		port: 16890,
	},
});

client.on('error', (err) => console.log('Redis Client Error', err));

await client.connect();

const app = express();
const PORT = 4050;
app.use(express.json());

app.post('/', async (req, res) => {
	try {
		console.log('in here');
		const { key, value } = req.body;
		console.log({ key, value });
		const response = await client.set(key, value);

		console.log(response);
		res.json({
			isSuccess: true,
			data: response,
		});
	} catch (error) {
		console.error('Error:', error);
		res.status(500).json({
			isSuccess: false,
			message: 'Internal Server Error',
			error,
		});
	}
});

app.get('/', async (req, res) => {
	try {
		const { key } = req.body;
		const value = await client.get(key);
		res.json({
			isSuccess: true,
			data: value,
		});
	} catch (error) {
		res.status(500).json({
			isSuccess: false,
			message: 'Internal Server Error',
			error,
		});
	}
});

app.listen(PORT, () => {
	console.log('Server is running at ', PORT);
});
