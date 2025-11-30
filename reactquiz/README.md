## SWE5006 Capstone Project: Kahoot Quiz

### Github repository : https://github.com/TandinZangmo456/SWE302_02230305/tree/main/reactquiz

This repository contains the capstone project for SWE5006 - Graduate Certificate in Designing Modern Software Systems (DMSS) at the National University of Singapore (NUS).

### Overview

The topic of this project is a Kahoot clone—a real-time, interactive quiz application inspired by the popular Kahoot platform. The goal is to demonstrate modern software design principles and full-stack development skills.

For setup instructions and further details, see below.

## Setup Instructions

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or newer recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)

### Installation

1. **Install dependencies:**

```bash
npm install
```

2. **Start the development server:**

```bash
npm run dev
```

The app will be available at [http://localhost:5173](http://localhost:5173) by default.

3. **Build for production:**

```bash
npm run build
```

4. **Preview the production build:**

```bash
npm run preview
```

5. **Lint the codebase:**

```bash
npm run lint
```

## Testing

This project includes comprehensive end-to-end tests using Playwright.

### Running Tests

1. **Start the development server:**

```bash
npm run dev
```

2. **Run all tests (in a separate terminal):**

```bash
npm run test
```

3. **Run tests with UI mode:**

```bash
npm run test:ui
```

4. **Run tests in debug mode:**

```bash
npm run test:debug
```

5. **View test reports:**

```bash
npm run test:report
```

### Test Coverage

The test suite covers all functional requirements outlined below:

- **Quiz Flow Tests**: Start quiz, answer selection, scoring, completion
- **Timer Tests**: Countdown functionality and expiry behavior
- **Game State Tests**: Restart functionality and question navigation
- **UI/UX Tests**: Responsive design and visual feedback
- **Edge Cases**: Rapid clicking and browser refresh scenarios
- **Data Validation**: Question integrity and score calculation

### Docker Setup (Alternative)

If you prefer to use Docker, you can run the application in a container:

1. **Build the Docker image:**

```bash
docker build -t quiz-app .
```

2. **Run the container:**

```bash
docker run -p 3000:3000 quiz-app
```

The app will be available at [http://localhost:3000](http://localhost:3000).

This project uses React, TypeScript, Vite, Tailwind CSS, and Lucide icons. For more details, see the source code and configuration files.

## Functional Test Cases

The following test cases can be used to validate the application functionality:

### 1. Quiz Flow Tests

**TC001: Start Quiz**

- **Precondition**: Application is loaded
- **Steps**: Click "Start Quiz" button
- **Expected**: Game transitions to playing state, first question appears, timer starts at 30 seconds

**TC002: Answer Selection**

- **Precondition**: Quiz is in playing state
- **Steps**: Click on any answer option
- **Expected**: Answer is highlighted, feedback is shown, auto-advances to next question after 1.5 seconds

**TC003: Correct Answer Scoring**

- **Precondition**: Quiz is playing, current question has correct answer at index 0
- **Steps**: Click the correct answer option
- **Expected**: Score increases by 1, positive feedback shown

**TC004: Incorrect Answer Handling**

- **Precondition**: Quiz is playing
- **Steps**: Click an incorrect answer option
- **Expected**: Score remains unchanged, correct answer highlighted, negative feedback shown

**TC005: Complete Quiz**

- **Precondition**: On the last question
- **Steps**: Answer the final question
- **Expected**: Game transitions to end state, final score displayed

### 2. Timer Tests

**TC006: Timer Countdown**

- **Precondition**: Quiz is playing
- **Steps**: Wait and observe timer
- **Expected**: Timer counts down from 30 to 0 in 1-second intervals

**TC007: Timer Expiry**

- **Precondition**: Quiz is playing, timer reaches 0
- **Steps**: Let timer reach 0 without answering
- **Expected**: Quiz ends automatically, final score shown

### 3. Game State Tests

**TC008: Restart Quiz**

- **Precondition**: Quiz has ended (game over screen visible)
- **Steps**: Click "Play Again" or restart button
- **Expected**: Quiz resets to start state, score resets to 0, question index resets to 0

**TC009: Question Navigation**

- **Precondition**: Quiz is playing
- **Steps**: Answer multiple questions in sequence
- **Expected**: Question counter advances correctly, new questions appear

### 4. UI/UX Tests

**TC010: Responsive Design**

- **Precondition**: Application loaded
- **Steps**: Resize browser window or test on different devices
- **Expected**: Layout adapts properly to different screen sizes

**TC011: Visual Feedback**

- **Precondition**: Quiz is playing
- **Steps**: Select answers and observe visual changes
- **Expected**: Selected answers show visual feedback, correct/incorrect states clearly indicated

### 5. Edge Cases

**TC012: Rapid Answer Selection**

- **Precondition**: Quiz is playing
- **Steps**: Quickly click multiple answer options before auto-advance
- **Expected**: Only first selection is registered, prevents multiple selections

**TC013: Browser Refresh**

- **Precondition**: Quiz is in progress
- **Steps**: Refresh the browser
- **Expected**: Quiz resets to start state (no persistence expected)

### 6. Data Validation Tests

**TC014: Question Data Integrity**

- **Precondition**: Application loaded
- **Steps**: Navigate through all questions
- **Expected**: All questions have 4 options, correct answer indices are valid (0-3)

**TC015: Score Calculation**

- **Precondition**: Complete quiz with known correct/incorrect answers
- **Steps**: Answer specific pattern of questions
- **Expected**: Final score matches expected calculation (correct answers / total questions)
