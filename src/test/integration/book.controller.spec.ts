import { bookRepository, userRepository } from '../../utils/initializeRepositories';
import { createUserTest, exampleBook } from '../utils';
import express, { Express } from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { dataSource } from '../../configs/orm.config';



describe('BookController', () => {
    let server: Express;

    beforeAll(async () => {

        if (!dataSource.isInitialized) {
            await dataSource.initialize();
            console.log("Data source initialized:", dataSource.isInitialized);
        }

        const app = express();
        server = app;
        app.use(express.json());
    });

    afterAll(async () => {
        if (dataSource.isInitialized) {
            await dataSource.destroy();
        }
    });

    describe('GET / - Get books on the main page', () => {
        it('should return books for the main page when user is authenticated', async () => {
            const user = await userRepository.save(createUserTest);
            const token = jwt.sign({ id: user.id }, process.env.SECRET_PHRASE_ACCESS_TOKEN!, { expiresIn: '1h' });

            exampleBook.user = user;
            await bookRepository.save(exampleBook);

            const response = await request(server)
                .get('/books/')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body).toEqual(expect.arrayContaining([expect.objectContaining({ title: exampleBook.title })]));
        });
    });

    describe('POST / - create book', () => {
        it('should return book', async () => {
            const user = await userRepository.save(createUserTest);
            const token = jwt.sign({ id: user.id }, process.env.SECRET_PHRASE_ACCESS_TOKEN!, { expiresIn: '1h' });

            const newBook = { ...exampleBook, title: "Unique Title", user };

            const response = await request(server)
                .post('/books/create')
                .set('Authorization', `Bearer ${token}`)
                .send(newBook);

            expect(response.status).toBe(201);
            expect(response.body).toEqual(expect.objectContaining({ title: newBook.title }));
        });

        it('should return error message when book title already exists', async () => {
            const user = await userRepository.save(createUserTest);
            const token = jwt.sign({ id: user.id }, process.env.SECRET_PHRASE_ACCESS_TOKEN!, { expiresIn: '1h' });

            const duplicateBook = { ...exampleBook, user };
            await bookRepository.save(duplicateBook);

            const response = await request(server)
                .post('/books/create')
                .set('Authorization', `Bearer ${token}`)
                .send(duplicateBook);

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Book title already exists');
        });
    });
});
