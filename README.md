```
python3 -m venv backend-env
.\backend-env\Scripts\Activate.ps1
# linux: source backend-env/bin/activate
# pip3 freeze > requirements.txt
pip install -r ./requirements.txt

uvicorn main:app --host localhost --port 8000 --reload
```

uvicorn main:app --reload

pip install "fastapi[all]"
