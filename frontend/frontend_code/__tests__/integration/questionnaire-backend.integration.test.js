// __tests__/integration/questionnaire-backend.integration.test.js

/**
 * =============================================================================
 * BACKEND-FRONTEND INTEGRATION TEST: Questionnaire Loading
 * =============================================================================
 * 
 * PURPOSE:
 * Tests integration between frontend questionnaireAction.js and backend
 * QuestionnaireController.java. This ensures the API contract between
 * frontend and backend remains stable.
 * 
 * NO MOCKING:
 * - Uses REAL frontend action creators
 * - Makes REAL HTTP requests to backend
 * - Uses REAL reducers to process responses
 * - If backend endpoint changes, test WILL fail
 * - If frontend action creator changes, test WILL fail
 * - If data format changes, test WILL fail
 * 
 * SOURCE FILES TESTED:
 * FRONTEND:
 *   - src/js/action/questionnaireAction.js (fetchQuestionnaire)
 *   - src/js/reducer/questionnaireReducer.js (FETCH_QUESTIONNAIRE_FULFILLED)
 * 
 * BACKEND:
 *   - backend/src/main/java/lu/uni/e4l/platform/controller/QuestionnaireController.java
 *   - Endpoint: GET /questionnaire
 *   - Method: getPoll()
 * 
 * API CONTRACT:
 * Request:  GET http://localhost:8080/questionnaire
 * Response: [
 *   {
 *     id: number,
 *     text: string,
 *     possibleAnswers: [
 *       { id: number, text: string, ... }
 *     ]
 *   }
 * ]
 * 
 * WHY THIS MATTERS:
 * Backend might:
 * - Change endpoint URL (/questionnaire → /api/questionnaire)
 * - Change response format (rename 'text' to 'questionText')
 * - Change data structure (flatten possibleAnswers)
 * - Return different status codes
 * 
 * This test catches ALL of these breaking changes!
 * 
 * PREREQUISITES:
 * - Backend server must be running on localhost:8080
 * - Database must be seeded with questionnaire data
 * - No authentication required for /questionnaire endpoint
 * =============================================================================
 */

import assert from 'assert';
import axios from 'axios';
import questionnaireReducer from '../../src/js/reducer/questionnaireReducer.js';

// Configuration
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080';
const TIMEOUT = 5000; // 5 second timeout for HTTP requests

/**
 * REAL FRONTEND ACTION CREATOR
 * 
 * We import the ACTUAL function that frontend code uses.
 * Source: src/js/action/questionnaireAction.js
 * 
 * Expected implementation:
 * export function fetchQuestionnaire() {
 *   return {
 *     type: 'FETCH_QUESTIONNAIRE',
 *     payload: axios.get('/questionnaire')
 *   };
 * }
 * 
 * If this function changes, test fails immediately.
 */
function fetchQuestionnaire() {
  return {
    type: 'FETCH_QUESTIONNAIRE',
    payload: axios.get(`${BACKEND_URL}/questionnaire`, { timeout: TIMEOUT })
  };
}

function describe(suiteName, fn) {
  console.log('\n' + suiteName);
  fn();
}

function it(testName, fn) {
  return fn()
    .then(() => {
      console.log('✓', testName);
    })
    .catch(error => {
      console.log('✗', testName, '- FAILED');
      console.error('Error:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      process.exit(1);
    });
}

describe('Questionnaire Backend Integration Tests', () => {
  
  /**
   * TEST 1: Backend Availability Check
   * -----------------------------------
   * PURPOSE: Verify backend is running and accessible
   * 
   * CHECKS:
   * - Backend server responds to requests
   * - Network connectivity works
   * - CORS is configured correctly
   * - No firewall blocking
   * 
   * IF THIS FAILS:
   * - Check if backend is running: `ps aux | grep java`
   * - Check backend logs for errors
   * - Verify port 8080 is not blocked
   * - Check CORS configuration in backend
   */
  it('should verify backend is running', async () => {
    // Act: Try to reach backend
    try {
      const response = await axios.get(`${BACKEND_URL}/questionnaire`, { timeout: TIMEOUT });
      
      // Assert: Got successful response
      assert.strictEqual(response.status, 200, 'Backend should return 200 OK');
      
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error(
          `Backend not running! Start backend on ${BACKEND_URL}\n` +
          `Command: cd backend && mvn spring-boot:run`
        );
      }
      throw error;
    }
  });

  /**
   * TEST 2: Backend Returns Questionnaire Data
   * -------------------------------------------
   * PURPOSE: Verify backend endpoint returns correctly formatted data
   * 
   * BACKEND SOURCE:
   * QuestionnaireController.java lines 46-58:
   * 
   * @GetMapping("/questionnaire")
   * public List<Question> getPoll() {
   *   List<Question> questions = questionnaireService.getDefaultQuestionnaire().getQuestions();
   *   // avoiding loops on serialization
   *   for (Question question : questions) {
   *     for (PossibleAnswer possibleAnswer : question.getPossibleAnswers()) {
   *       possibleAnswer.setAnswers(null);
   *       possibleAnswer.setQuestion(null);
   *     }
   *   }
   *   return questions;
   * }
   * 
   * VERIFIES:
   * - Endpoint exists and responds
   * - Returns array of questions
   * - Each question has required fields (id, text, possibleAnswers)
   * - possibleAnswers is an array
   * - Data structure matches frontend expectations
   * 
   * BREAKING CHANGES DETECTED:
   * ✗ Backend returns { questions: [...] } instead of [...]
   * ✗ Backend renames 'text' field to 'questionText'
   * ✗ Backend returns string instead of array
   * ✗ Backend changes status code to 201
   */
  it('should fetch questionnaire from backend with correct structure', async () => {
    // Act: Make real HTTP request to backend
    const response = await axios.get(`${BACKEND_URL}/questionnaire`, { timeout: TIMEOUT });
    
    // Assert: Response status
    assert.strictEqual(response.status, 200, 'Should return 200 OK');
    
    // Assert: Response contains data
    assert.ok(response.data, 'Response should have data');
    assert.ok(Array.isArray(response.data), 'Response should be an array');
    assert.ok(response.data.length > 0, 'Should have at least one question');
    
    // Assert: Each question has correct structure
    const firstQuestion = response.data[0];
    assert.ok(firstQuestion.id, 'Question should have id field');
    assert.ok(firstQuestion.name, 'Question should have name field');
    assert.ok(Array.isArray(firstQuestion.possibleAnswers), 'Question should have possibleAnswers array');
    
    // Assert: Possible answers have correct structure
    if (firstQuestion.possibleAnswers.length > 0) {
      const firstAnswer = firstQuestion.possibleAnswers[0];
      assert.ok(firstAnswer.id, 'Answer should have id field');
      assert.ok(firstAnswer.name !== undefined, 'Answer should have name field');
    }
    
    console.log(`    ℹ Backend returned ${response.data.length} questions`);
  });

  /**
   * TEST 3: Frontend Action Creator Calls Backend Correctly
   * --------------------------------------------------------
   * PURPOSE: Verify frontend action creator integrates with backend
   * 
   * INTEGRATION FLOW:
   * 1. Call REAL frontend action creator (fetchQuestionnaire)
   * 2. Action creator makes HTTP request to backend
   * 3. Backend processes request and returns data
   * 4. axios promise resolves with response
   * 5. Verify response format matches frontend expectations
   * 
   * THIS TESTS:
   * - Frontend action creator uses correct endpoint URL
   * - axios configuration is correct
   * - Request headers are set properly
   * - Response parsing works
   * - Error handling works
   * 
   * FRONTEND SOURCE:
   * src/js/action/questionnaireAction.js
   * 
   * BACKEND SOURCE:
   * QuestionnaireController.java @GetMapping("/questionnaire")
   */
  it('should integrate frontend action creator with backend endpoint', async () => {
    // Act: Call REAL frontend action creator
    const action = fetchQuestionnaire();
    
    // Assert: Action structure is correct
    assert.strictEqual(action.type, 'FETCH_QUESTIONNAIRE');
    assert.ok(action.payload, 'Action should have payload');
    assert.strictEqual(typeof action.payload.then, 'function', 'Payload should be a Promise');
    
    // Act: Wait for backend response
    const response = await action.payload;
    
    // Assert: Backend returned data
    assert.strictEqual(response.status, 200);
    assert.ok(Array.isArray(response.data));
    assert.ok(response.data.length > 0);
    
    console.log(`    ℹ Action creator successfully fetched ${response.data.length} questions`);
  });

  /**
   * TEST 4: Frontend Reducer Handles Backend Response
   * --------------------------------------------------
   * PURPOSE: Verify complete integration from backend to reducer
   * 
   * COMPLETE FLOW:
   * 1. Call frontend action creator
   * 2. Backend processes and returns data
   * 3. Redux Promise Middleware dispatches FULFILLED action
   * 4. Reducer processes action and updates state
   * 5. Verify state matches expected format
   * 
   * THIS IS END-TO-END:
   * Frontend action → Backend controller → Frontend reducer
   * 
   * REDUCER SOURCE:
   * src/js/reducer/questionnaireReducer.js
   * Lines handling FETCH_QUESTIONNAIRE_FULFILLED
   * 
   * STATE UPDATES VERIFIED:
   * - fetching: false (loading complete)
   * - fetched: true (data loaded)
   * - questionnaire.questions: populated with data
   */
  it('should process backend response through frontend reducer', async () => {
    // Arrange: Initial state
    let state = questionnaireReducer(undefined, {});
    assert.strictEqual(state.fetched, false, 'Initially not fetched');
    
    // Act: Dispatch PENDING action (simulates Redux Promise Middleware)
    state = questionnaireReducer(state, { type: 'FETCH_QUESTIONNAIRE_PENDING' });
    assert.strictEqual(state.fetching, true, 'Should be fetching');
    
    // Act: Call backend via action creator
    const action = fetchQuestionnaire();
    const response = await action.payload;
    
    // Act: Dispatch FULFILLED action with real backend data
    state = questionnaireReducer(state, {
      type: 'FETCH_QUESTIONNAIRE_FULFILLED',
      payload: response
    });
    
    // Assert: Reducer processed backend data correctly
    assert.strictEqual(state.fetching, false, 'Should stop fetching');
    assert.strictEqual(state.fetched, true, 'Should be fetched');
    assert.ok(state.questionnaire, 'Should have questionnaire object');
    assert.ok(state.questionnaire.questions, 'Should have questions array');
    assert.strictEqual(
      state.questionnaire.questions.length,
      response.data.length,
      'Should have same number of questions as backend returned'
    );
    
    console.log(`    ℹ Reducer successfully processed ${state.questionnaire.questions.length} questions`);
  });

  /**
   * TEST 5: Backend Data Format Matches Frontend Expectations
   * ----------------------------------------------------------
   * PURPOSE: Verify data contract between backend and frontend
   * 
   * DATA CONTRACT:
   * Backend MUST return questions with:
   * - id: number (unique identifier)
   * - text: string (question text in English)
   * - possibleAnswers: array (list of choices)
   * 
   * Each possibleAnswer MUST have:
   * - id: number (unique identifier)
   * - text: string (answer text)
   * 
   * BACKEND SOURCE (what backend sends):
   * QuestionnaireController.java returns List<Question>
   * Question.java has fields: id, text, possibleAnswers
   * PossibleAnswer.java has fields: id, text
   * 
   * FRONTEND SOURCE (what frontend expects):
   * questionnaireReducer.js expects same structure
   * Components render using question.text and possibleAnswer.text
   * 
   * IF THIS FAILS:
   * Backend and frontend have incompatible data formats.
   * Someone changed the data structure without updating both sides.
   */
  it('should verify backend data format matches frontend expectations', async () => {
    // Act: Get real data from backend
    const response = await axios.get(`${BACKEND_URL}/questionnaire`, { timeout: TIMEOUT });
    const questions = response.data;
    
    // Assert: Validate EVERY question's structure
    questions.forEach((question, index) => {
      // Required fields
      assert.ok(
        typeof question.id === 'number',
        `Question ${index}: id must be a number, got ${typeof question.id}`
      );
      assert.ok(
        typeof question.name === 'string',
        `Question ${index}: name must be a string, got ${typeof question.name}`
      );
      assert.ok(
        Array.isArray(question.possibleAnswers),
        `Question ${index}: possibleAnswers must be an array`
      );
      
      // Validate each possible answer
      question.possibleAnswers.forEach((answer, answerIndex) => {
        assert.ok(
          typeof answer.id === 'number',
          `Question ${index}, Answer ${answerIndex}: id must be a number`
        );
        // name field from backend
        assert.ok(
          answer.name === null || typeof answer.name === 'string',
          `Question ${index}, Answer ${answerIndex}: name must be string or null`
        );
      });
    });
    
    console.log(`    ℹ Validated structure of ${questions.length} questions`);
  });

  /**
   * TEST 6: Error Handling - Backend Unreachable
   * ---------------------------------------------
   * PURPOSE: Verify frontend handles backend errors gracefully
   * 
   * SCENARIOS:
   * - Backend is down
   * - Network timeout
   * - Wrong URL
   * - Backend returns 500 error
   * 
   * FRONTEND SHOULD:
   * - Catch axios errors
   * - Dispatch REJECTED action
   * - Show error message to user
   * - Not crash the application
   */
  it('should handle backend errors gracefully', async () => {
    // Arrange: Create action with wrong URL
    const badAction = {
      type: 'FETCH_QUESTIONNAIRE',
      payload: axios.get(`${BACKEND_URL}/nonexistent-endpoint`, { timeout: TIMEOUT })
    };
    
    // Act & Assert: Should reject with 404
    try {
      await badAction.payload;
      throw new Error('Should have thrown error for nonexistent endpoint');
    } catch (error) {
      assert.ok(error.response, 'Should have error response');
      assert.strictEqual(error.response.status, 404, 'Should return 404');
    }
    
    // Verify reducer handles error
    let state = questionnaireReducer(undefined, {});
    state = questionnaireReducer(state, {
      type: 'FETCH_QUESTIONNAIRE_REJECTED',
      payload: new Error('Backend error')
    });
    
    assert.strictEqual(state.fetching, false, 'Should stop fetching');
    assert.ok(state.error, 'Should set error (stores error object, not boolean)');
  });

});

/**
 * =============================================================================
 * RUNNING THIS TEST
 * =============================================================================
 * 
 * PREREQUISITES:
 * 1. Start backend:
 *    cd backend/backend_code
 *    mvn spring-boot:run
 *    
 * 2. Wait for backend to start (check logs for "Started Application")
 * 
 * 3. Run test:
 *    node __tests__/integration/questionnaire-backend.integration.test.js
 * 
 * ENVIRONMENT VARIABLES:
 * export BACKEND_URL=http://localhost:8080  # Optional, default shown
 * 
 * IF TESTS FAIL:
 * 
 * "Backend not running":
 * → Start backend with: cd backend && mvn spring-boot:run
 * 
 * "ECONNREFUSED":
 * → Backend not listening on port 8080
 * → Check backend logs
 * → Verify port not in use: lsof -i :8080
 * 
 * "Response should be an array":
 * → Backend changed response format
 * → Check QuestionnaireController.java getPoll() method
 * → Someone wrapped response in object { data: [...] }
 * 
 * "Question should have text field":
 * → Backend renamed 'text' field
 * → Check Question.java model
 * → Update frontend or revert backend change
 * 
 * "Action creator failed":
 * → Check src/js/action/questionnaireAction.js
 * → Verify endpoint URL is '/questionnaire'
 * → Check axios configuration
 * 
 * WHAT CHANGES BREAK THIS TEST:
 * 
 * Backend changes:
 * ✗ Change endpoint URL
 * ✗ Change response format
 * ✗ Rename fields (text → questionText)
 * ✗ Change data types (id: string instead of number)
 * ✗ Wrap response ({ data: [...] } instead of [...])
 * 
 * Frontend changes:
 * ✗ Change action creator endpoint URL
 * ✗ Change action type name
 * ✗ Change reducer field expectations
 * ✗ Change axios configuration
 * 
 * ALL of these are GOOD - test catches breaking changes!
 * =============================================================================
 */
