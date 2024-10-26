import { bookRepository, userRepository } from '../../utils/initializeRepositories';
import { createUserTest, exampleBook } from '../utils';
import express, { Express } from 'express';

describe('BookController', () => {
    let server: Express;

    beforeAll(async () => {
        const app = express();
        server = app;

    });

    describe('GET / - Get books on the main page', () => {
        it('should return books for the main page when user is authenticated', async () => {
            const user = await userRepository.save(createUserTest);
            exampleBook.user = user;
            await bookRepository.save(exampleBook);

            //TODO: const jwt = sign(createUserTest, process.env.SECRET_PHRASE_ACCESS_TOKEN...
            //TODO: const response = await request(server).get('/books/')

            //TODO expect(response.body...
            //TODO expect(clientRedis...
        });
    });

    describe('POST / - create book', () => {
        it('should return book', async () => {
            //TODO
        });

        it('should return error message, when book title already exists', async () => {
            //TODO
        });
    });
});
