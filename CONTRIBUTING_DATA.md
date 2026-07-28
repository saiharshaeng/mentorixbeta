# Contributing Question Data to Mentorix

## Before You Start
- Source must be official NTA/IIT publication or verified coaching institute key
- You MUST cite the source URL or publication in `answerSource`
- Run the validator before submitting

## Steps to Add a New Paper
1. Place the raw/original file in `src/data/pyq/raw/` — never edit it
2. Write a parser or manually create a JSON array following the schema in DATA_ARCHITECTURE.md
3. Run `node scripts/fix-jee-data.js` to normalize fields and classify chapters
4. Run `node scripts/validate-data.js` — all issues must be resolved before serving
5. Add the bank to `master_index_v3.json` with `quarantined: false` only if score ≥ 4 for ≥ 80% of questions
6. Update `DATA_ARCHITECTURE.md` to list the new paper

## Answer Key Rules
- Only use: jeeadv.ac.in, jeeMain.nta.ac.in, official coaching keys citing official source
- Never accept: Reddit, YouTube, Quora, unverified websites
- Set `answerSource` to the exact URL or publication you used

## What NOT to do
- ❌ Do not use ChatGPT or any AI to generate question text, options, or answers
- ❌ Do not paraphrase official questions
- ❌ Do not submit a bank with >40% same answer option
- ❌ Do not modify raw/ files
- ❌ Do not bypass the validator
