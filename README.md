# App Studio — Django Project

This is the clean, merged Django project. It contains one Django project (`app_studio`) and five Django apps:

| App folder | Purpose | URL |
| --- | --- | --- |
| `dashboard` | Home page that connects everything | `/` |
| `alarms` | Alarm application from the Alarm repository | `/alarm/` |
| `calculator` | Scientific calculator from the Calculator repository | `/calculator/` |
| `scores` | Jumping Box game from the Jumping repository | `/jumping/` |
| `snake_game` | Snake game and leaderboard from the Snake repository | `/snake/` |

The four imported folders are only Django **apps**. Their old project folders (`alarm_project`, `sci_calculator`, and `myproject`) are not included here.

## Run locally

From this `app-studio` folder:

```bash
python3 -m pip install -r requirements.txt
python3 manage.py migrate
python3 manage.py runserver
```

Open http://127.0.0.1:8000/ in a browser.

The dashboard links to all four app interfaces. Alarm Clock requires a user account; choose **Sign up** on the dashboard before creating alarms.

## Structure

```text
app-studio/
├── app_studio/       # Main Django settings and root URLs
├── dashboard/        # Shared landing page
├── alarms/           # Imported Alarm app
├── calculator/       # Imported Calculator app
├── scores/           # Imported Jumping Box app
├── snake_game/       # Imported Snake app
└── manage.py
```
# app-studio
