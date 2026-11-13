@echo off
cd /d "%~dp0.."
python -m pip install ddgs pillow requests
python scripts\buscar_fotos.py
pause
