# Manolog – Personal Life Analytics Platform

## Description

Manolog is an innovative full-stack web application that redefines personal life analytics, serving as a "personal data scientist for life." It seamlessly integrates journaling, habit tracking, emotional logging, time tracking, and life evaluation into a single platform, empowering users to gain profound insights into their daily behaviors and overall well-being.

At its core, Manolog addresses key questions: How is my life progressing? What behavioral patterns emerge? What influences mood and productivity? Where is life unbalanced? By collecting both structured and unstructured data, it transforms routine inputs into actionable intelligence.

### Key Features

- **Daily Diary Notepad**: One daily entry with auto-save, streak encouragement, and calendar navigation for reflection.
- **Structured Pads System**: Custom pads for goals, books, ideas, and tasks, featuring completion tracking and notes.
- **Time Tracker**: Quick logging of sleep, screen time, work/study, and expenses, locked after 24 hours for accuracy.
- **Time Table Creator**: Weekly schedule planning with conflict detection to define ideal routines.
- **Life Rating System**: Weekly 0-10 ratings across health, finances, relationships, etc., locked for integrity.
- **Emotion Tracker**: Daily emotion selection (e.g., happy, stressed), editable briefly.
- **Habit Tracker**: Custom habits with streaks, completion rates, and visual progress.
- **Daily Dashboard**: Centralized view of diary, emotions, time, habits, and tasks for quick rituals.
- **Insight Engine**: Advanced analytics engine delivering correlations (e.g., sleep-stress links), habit impacts, trends, and balance assessments, fostering data-driven self-improvement.

### Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS for intuitive, responsive design.
- **Backend**: Node.js, Express for scalable APIs.
- **Database**: MongoDB for flexible storage.
- **Analytics**: Python with Pandas, NumPy, Scikit-learn for user-specific pattern detection.

Manolog prioritizes privacy, using statistical analysis on individual datasets to reveal patterns without predictions. Its vision is to cultivate deeper self-awareness, promoting balanced lives and informed decisions through intelligent data interpretation.

## Installation

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- Python (for analytics, optional for basic setup)

## Project Structure

```
manologai-b/
├── src/
│   ├── config/
│   │   └── database.js
│   ├── models/
│   │   └── user.js
│   ├── routes/
│   ├── controllers/
│   └── middleware/
├── app.js
├── package.json
├── .env
├── .gitignore
└── README.md
```

## Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Open a Pull Request.

## License

This project is licensed under the ISC License.

## Contact

For questions or support, open an issue on GitHub.
