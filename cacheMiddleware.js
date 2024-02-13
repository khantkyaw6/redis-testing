import { createClient } from 'redis';
import express from 'express';

const app = express();
const client = createClient();

function cache(req, res, next) {
	client.get();
}
