# Mentorix Previous Year Questions (PYQ) Database

## Instructions for Adding Official Exam Papers

Place normalized JSON files in this directory using the standard naming format:
`[examId]_[year]_[subject].json`

### Supported Exam IDs:
- `jee_main` (JEE Main)
- `jee_adv` (JEE Advanced)
- `neet` (NEET UG)

### File Naming Examples:
- `jee_main_2024_physics.json`
- `jee_adv_2024_paper1.json`
- `neet_2024_biology.json`

### JSON Structure:
```json
{
  "meta": {
    "exam": "jee_main",
    "year": 2024,
    "subject": "Physics",
    "totalQuestions": 25,
    "source": "Official NTA Paper"
  },
  "questions": [
    {
      "id": "jee_main_2024_p_1",
      "exam": "jee_main",
      "year": 2024,
      "subject": "Physics",
      "chapter": "Kinematics",
      "q": "Question text with $LaTeX$ math",
      "opts": ["Option A", "Option B", "Option C", "Option D"],
      "ans": [0],
      "type": "mcq",
      "expl": "Step-by-step solution"
    }
  ]
}
```
