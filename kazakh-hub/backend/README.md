# Kazakh Hub Backend API

Backend сервері Node.js және Express пайдаланады.

## Орнату

```bash
cd backend
npm install
```

## Іске қосу

### Development режимде:
```bash
npm run dev
```

### Production режимде:
```bash
npm start
```

Сервер `http://localhost:3000` адресінде іске қосылады.

## API Endpoints

### Health Check
- `GET /api/health` - Сервердің жұмыс істеп тұрғанын тексеру

### Code Files
- `GET /api/codes` - Барлық код файлдарын алу
- `GET /api/codes/:id` - Белгілі бір код файлын алу
- `POST /api/codes` - Жаңа код файлын құру
- `PUT /api/codes/:id` - Код файлын жаңарту
- `DELETE /api/codes/:id` - Код файлын жою

### Users
- `GET /api/user` - Ағымдағы пайдаланушыны алу
- `GET /api/users/:id` - Пайдаланушы профилін алу

## Мәліметтер сақтау

Қазіргі уақытта мәліметтер жадта (in-memory) сақталады. Серверді қайта іске қосқанда барлық мәліметтер жоғалады.

Келесі қадамдарда базаға (MongoDB, PostgreSQL, т.б.) қосуға болады.

