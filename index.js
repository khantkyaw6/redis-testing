import { createClient } from 'redis';
import express from 'express';
import axios from 'axios';

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
const JSONURL = 'https://jsonplaceholder.typicode.com/posts';
app.use(express.json());

app.post('/', async (req, res) => {
	try {
		console.log('in here');
		const { key, value } = req.body;
		console.log({ key, value });
		const response = await client.set(key, value);

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

app.get('/posts/:id', async (req, res) => {
	try {
		const { id } = req.params;

		const cachedPost = await client.get(`post-${id}`);

		if (cachedPost) {
			return res.json({
				isSuccess: true,
				data: JSON.parse(cachedPost),
			});
		}

		const response = await axios.get(`${JSONURL}/${id}`);
		const result = await client.set(
			`post-${id}`,
			JSON.stringify(response.data),
			'EX',
			10
		);

		res.json({
			isSuccess: true,
			data: response.data,
			result,
		});
	} catch (error) {
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

app.put('/posts/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const { updatedValue } = req.body;

		// Check if the key already exists in Redis
		const cachedPost = await client.get(`post-${id}`);

		if (cachedPost) {
			// Update the existing data in Redis
			const updatedData = JSON.parse(cachedPost);
			updatedData.updatedValue = updatedValue; // Modify as needed

			await client.set(
				`post-${id}`,
				JSON.stringify(updatedData),
				'EX',
				10
			);

			res.json({
				isSuccess: true,
				data: updatedData,
				message: 'Data updated successfully.',
			});
		} else {
			// Perform the update operation (e.g., using axios)
			const updateResponse = await axios.put(`${JSONURL}/${id}`, {
				updatedValue,
			});

			// Update the cached data in Redis
			await client.set(
				`post-${id}`,
				JSON.stringify(updateResponse.data),
				'EX',
				10
			);

			res.json({
				isSuccess: true,
				data: updateResponse.data,
				message: 'Data created and cached successfully.',
			});
		}
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
