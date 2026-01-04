# Зависимостьтерді орнату (Install Dependencies)

SQL базасы үшін жаңа пакеттерді орнату керек:

```bash
cd backend
source venv/bin/activate
pip install sqlalchemy>=2.0.0 bcrypt>=4.0.0
```

Немесе барлық зависимостьтерді қайта орнату:

```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

Орнатудан кейін серверді қайта іске қосыңыз:

```bash
./run.sh
```

Немесе:

```bash
source venv/bin/activate
python3 main.py
```



