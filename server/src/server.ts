import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { convertHourStringToMinutes } from './utils/convert-hour-string-to-minutes';
import { convertMinutesToHour } from './utils/convert-minutes-to-hour';

const app = express();

const prisma = new PrismaClient();

// Permite que seja possível visualizar os dados em formato JSon
app.use(express.json());

// Permite que o API seja acessado por qualquer front end
app.use(cors());

// Rota para listar todos os games, utilizando a sintaxe do Prisma
app.get('/games', async (request, response) => {

	const games = await prisma.game.findMany({
		include: {
			_count: {
				select: {
					ads: true
				}
			}
		}
	});

	return response.json(games);
});

// Rota para criar um AD dentro de um game
app.post('/games/:id/ads', async (request, response) => {
	const gameId = request.params.id;
	const body = request.body;

	const ad = await prisma.ad.create({
		data: {
			gameId,
			name: body.name,
			yearsPlaying: body.yearsPlaying,
			discord: body.discord,
			weekDays: body.weekDays.join(','),
			hourStart: convertHourStringToMinutes(body.hourStart),
			hourEnd: convertHourStringToMinutes(body.hourEnd),
			useVoiceChannel: body.useVoiceChannel
		}
	})

	return response.status(201).json(ad);
});

// Lista todos os AD's de um único game, ignorando o dado 'discord'
app.get('/games/:id/ads', async (request, response) => {
	const gameId = request.params.id;

	const ads = await prisma.ad.findMany({
		select: {
			id: true,
			name: true,
			weekDays: true,
			useVoiceChannel: true,
			yearsPlaying: true,
			hourStart: true,
			hourEnd: true,
		},
		where: {
			gameId
		},
		orderBy: {
			createdAt: 'desc'
		}
	})

	return response.json(ads.map(ad => {
		return {
			...ad,
			weekDays: ad.weekDays.split(','),
			hourStart: convertMinutesToHour(ad.hourStart),
			hourEnd: convertMinutesToHour(ad.hourEnd)
		}
	}))
});

// Visualizar o discord que cadastrou o AD
app.get('/ads/:id/discord', async (request, response) => {

	const adId = request.params.id;

	const ad = await prisma.ad.findUniqueOrThrow({
		select: {
			discord: true
		},
		where: {
			id: adId,
		}
	})

	return response.json({
		discord: ad.discord
	});
});

// Porta
app.listen(3333)