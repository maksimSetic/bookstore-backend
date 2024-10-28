import 'dotenv/config';
import { StartedPostgreSqlContainer, PostgreSqlContainer } from '@testcontainers/postgresql';
import { DataSource } from 'typeorm';
import express, { Express } from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { bookRepository, userRepository } from '../../utils/initializeRepositories';
import { createUserTest, exampleBook } from '../utils';
import { BookEntity } from '../../entities/book.entity';
import { UserEntity } from '../../entities/user.entity';
import { RefreshSessionEntity } from '../../entities/refreshSession.entity';
import { CommentEntity } from '../../entities/comment.entity';
import { PromoCodeEntity } from '../../entities/promocode.entity';
import { OrderEntity } from '../../entities/order.entity';
import { ResetPasswordEntity } from '../../entities/resetPassword.entity';
import { LanguageEntity } from '../../entities/language.entity';
import { CategoryEntity } from '../../entities/category.entity';
import { PublisherEntity } from '../../entities/publishers.entity';
import { GenreEntity } from '../../entities/genre.entity';
import { AuthorEntity } from '../../entities/author.entity';

jest.mock('../../utils/initializeRepositories', () => ({
    userRepository: {
        save: jest.fn(),
    },
    bookRepository: {
        save: jest.fn(),
        find: jest.fn(),
    },
}));

describe('BookController', () => {
    let server: Express;
    let testDataSource: DataSource;
    let container: StartedPostgreSqlContainer;

    beforeAll(async () => {
        // Start the PostgreSQL Testcontainer
        container = await new PostgreSqlContainer()
            .withDatabase('test_db')
            .withUsername('test_user')
            .withPassword('test_password')
            .start();

        // Initialize a separate test DataSource
        testDataSource = new DataSource({
            type: 'postgres',
            host: container.getHost(),
            port: container.getMappedPort(5432),
            username: container.getUsername(),
            password: container.getPassword(),
            database: container.getDatabase(),
            entities: [
                BookEntity, RefreshSessionEntity, UserEntity, CommentEntity, 
                LanguageEntity, CategoryEntity, PublisherEntity, GenreEntity, 
                AuthorEntity, PromoCodeEntity, OrderEntity, ResetPasswordEntity
            ],
            synchronize: true,
            logging: false,
        });

        await testDataSource.initialize();

        const app = express();
        server = app;
        app.use(express.json());

        // Authentication middleware
        app.use((req, res, next) => {
            const token = req.headers.authorization?.split(' ')[1];
            if (token) {
                jwt.verify(token, process.env.SECRET_PHRASE_ACCESS_TOKEN!, (err, decoded) => {
                    if (err) return res.status(401).json({ message: 'Unauthorized' });
                    req.user = decoded;
                    next();
                });
            } else {
                return res.status(401).json({ message: 'Unauthorized' });
            }
        });

        app.get('/books/', async (req, res) => {
            try {
                const books = await bookRepository.find();
                return res.json(books);
            } catch (error) {
                console.error('Error fetching books:', error);
                return res.status(500).json({ message: 'Internal server error' });
            }
        });

        app.post('/books/create', async (req, res) => {
            try {
                const newBook = await bookRepository.save(req.body);
                return res.status(201).json(newBook);
            } catch (error) {
                console.error('Error creating book:', error);

                if (error.message === 'Book title already exists') {
                    return res.status(400).json({ message: 'Book title already exists' });
                }
                return res.status(500).json({ message: 'Internal server error' });
            }
        });
    });

    afterAll(async () => {
        await testDataSource.destroy();
        await container.stop();
    });

    beforeEach(() => {
        (bookRepository.find as jest.Mock).mockResolvedValue([exampleBook]);
        (bookRepository.save as jest.Mock).mockResolvedValue(exampleBook);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /books - Get books on the main page', () => {
        it('should return books for the main page when user is authenticated', async () => {
            const user = { ...createUserTest, id: 1 };
            const token = jwt.sign({ id: user.id }, process.env.SECRET_PHRASE_ACCESS_TOKEN!, { expiresIn: '1h' });

            const response = await request(server)
                .get('/books/')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body).toEqual(expect.arrayContaining([expect.objectContaining({ title: exampleBook.title })]));
        });
    });

    describe('POST /books/create - Create book', () => {
        it('should return the created book', async () => {
            const user = { ...createUserTest, id: 1 };
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
            const user = { ...createUserTest, id: 1 };
            const token = jwt.sign({ id: user.id }, process.env.SECRET_PHRASE_ACCESS_TOKEN!, { expiresIn: '1h' });

            const duplicateBook = { ...exampleBook, title: "Duplicate Title", user };

            // Mocking the error condition explicitly
            (bookRepository.save as jest.Mock).mockImplementationOnce(() => {
                throw new Error('Book title already exists');
            });

            const response = await request(server)
                .post('/books/create')
                .set('Authorization', `Bearer ${token}`)
                .send(duplicateBook);

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Book title already exists');
        });
    });
});
