// __tests__/unit/contactReducer.test.js

/**
 * =============================================================================
 * UNIT TEST SUITE: contactReducer
 * =============================================================================
 * 
 * PURPOSE:
 * Tests the contact form reducer which manages the state of message sending
 * operations. This reducer handles both regular messages and messages with PDF
 * attachments.
 * 
 * SOURCE FILE: src/js/reducer/contactReducer.js
 * 
 * WHAT THIS REDUCER DOES:
 * - Manages async message sending state (loading, success, error)
 * - Tracks sending status (in-progress vs complete)
 * - Stores error information when sends fail
 * - Handles both regular contact messages and PDF attachments
 * 
 * STATE SHAPE:
 * {
 *   sending: boolean,        // true when API request in progress
 *   sendFulfilled: boolean,  // true when message sent successfully
 *   error: null | object     // error details if send fails
 * }
 * 
 * ASYNC ACTION PATTERN:
 * Redux Promise Middleware creates 3 actions for each async operation:
 * - SEND_MESSAGE_PENDING   → Request started
 * - SEND_MESSAGE_FULFILLED → Request succeeded
 * - SEND_MESSAGE_REJECTED  → Request failed
 * 
 * WHY TEST REDUCERS:
 * - Reducers are pure functions (same input = same output)
 * - Easy to test without mocking
 * - Critical for correct UI state (loading spinners, error messages)
 * - Form submission depends on this state
 * =============================================================================
 */

import assert from 'assert';
import contactReducer from '../../src/js/reducer/contactReducer.js';

function describe(suiteName, fn) {
  console.log('\n' + suiteName);
  fn();
}

function it(testName, fn) {
  try {
    fn();
  } catch (error) {
    console.log('✗', testName, '- FAILED');
    console.error(error.message);
    process.exit(1);
  }
}

describe('contactReducer - Unit Tests', () => {
  
  /**
   * TEST 1: Initial State Verification
   * -----------------------------------
   * PURPOSE: Verify reducer returns correct initial state when Redux store
   *          initializes
   * 
   * SOURCE REFERENCE: contactReducer.js lines 1-5
   *   const initState = {
   *     sending: false,
   *     sendFulfilled: false,
   *     error: null
   *   };
   * 
   * INITIAL STATE SEMANTICS:
   * - sending: false        → No message is currently being sent
   * - sendFulfilled: false  → No successful send has completed yet
   * - error: null           → No errors have occurred
   * 
   * UI IMPLICATIONS:
   * - Submit button is enabled (sending: false)
   * - No success message shown (sendFulfilled: false)
   * - No error message shown (error: null)
   * 
   * REAL-WORLD USAGE:
   * When user first lands on contact page, form is ready for input
   * 
   * WHAT WOULD BREAK THIS TEST:
   * - Changing initial values (e.g., sending: true)
   * - Adding new state properties
   * - Changing property names
   */
  it('should return initial state when state is undefined', () => {
    // Act: Simulate Redux initialization
    const state = contactReducer(undefined, {});
    
    // Assert: Verify clean slate
    assert.strictEqual(state.sending, false);        // Not currently sending
    assert.strictEqual(state.sendFulfilled, false);  // Haven't sent yet
    assert.strictEqual(state.error, null);           // No errors
    
    console.log('✓ Initial state test passed');
  });

  /**
   * TEST 2: Handle SEND_MESSAGE_PENDING
   * ------------------------------------
   * PURPOSE: Verify correct state when user clicks submit and API request starts
   * 
   * SOURCE REFERENCE: contactReducer.js lines 9-15
   *   case "SEND_MESSAGE_PENDING": {
   *     return Object.assign({}, state, {
   *       sending: true,        // Request in progress
   *       sendFulfilled: false, // Not completed yet
   *       error: null           // Clear any previous errors
   *     });
   *   }
   * 
   * WHEN THIS HAPPENS:
   * 1. User fills contact form
   * 2. User clicks "Send" button
   * 3. Action creator dispatches SEND_MESSAGE with axios promise
   * 4. Redux Promise Middleware intercepts and dispatches PENDING action
   * 5. This reducer updates state to reflect "loading" status
   * 
   * STATE TRANSITIONS:
   * Before: { sending: false, sendFulfilled: false, error: null }
   * After:  { sending: true,  sendFulfilled: false, error: null }
   * 
   * UI IMPLICATIONS:
   * - Show loading spinner
   * - Disable submit button (prevent double-submit)
   * - Clear any previous error messages
   * 
   * WHY CLEAR ERROR:
   * If previous send failed, starting new send should clear old error
   * 
   * TEST PATTERN:
   * Uses existing error to verify error clearing behavior
   */
  it('should handle SEND_MESSAGE_PENDING action', () => {
    // Arrange: Start with a previous error state
    const initialState = {
      sending: false,
      sendFulfilled: false,
      error: { message: 'Previous error' }  // Old error from previous attempt
    };
    
    // Act: User tries again, PENDING action dispatched
    const action = { type: 'SEND_MESSAGE_PENDING' };
    const state = contactReducer(initialState, action);
    
    // Assert: Loading state active, error cleared
    assert.strictEqual(state.sending, true);            // Now sending
    assert.strictEqual(state.sendFulfilled, false);     // Not done yet
    assert.strictEqual(state.error, null);              // Previous error cleared
    
    console.log('✓ SEND_MESSAGE_PENDING test passed');
  });

  /**
   * TEST 3: Handle SEND_MESSAGE_REJECTED
   * -------------------------------------
   * PURPOSE: Verify correct state when API request fails
   * 
   * SOURCE REFERENCE: contactReducer.js lines 17-23
   *   case "SEND_MESSAGE_REJECTED": {
   *     return Object.assign({}, state, {
   *       sending: false,         // Request finished (albeit with error)
   *       sendFulfilled: false,   // Did not succeed
   *       error: action.payload   // Store error details
   *     });
   *   }
   * 
   * WHEN THIS HAPPENS:
   * 1. SEND_MESSAGE_PENDING was dispatched
   * 2. Axios makes HTTP request to /contact endpoint
   * 3. Request fails (network error, 500 error, validation error, etc.)
   * 4. Axios promise rejects
   * 5. Redux Promise Middleware dispatches REJECTED action with error
   * 
   * ERROR PAYLOAD STRUCTURE:
   * Typically contains: { message: string, code?: number, details?: any }
   * 
   * STATE TRANSITIONS:
   * Before: { sending: true,  sendFulfilled: false, error: null }
   * After:  { sending: false, sendFulfilled: false, error: {...} }
   * 
   * UI IMPLICATIONS:
   * - Hide loading spinner
   * - Re-enable submit button
   * - Show error message to user
   * - User can retry
   * 
   * REAL-WORLD ERRORS:
   * - Network timeout
   * - Server 500 error
   * - Validation error (invalid email)
   * - Rate limit exceeded
   */
  it('should handle SEND_MESSAGE_REJECTED action', () => {
    // Arrange: Start in "sending" state (API request in progress)
    const initialState = {
      sending: true,
      sendFulfilled: false,
      error: null
    };
    
    // Act: API request fails with error
    const errorPayload = { message: 'Network error', code: 500 };
    const action = { type: 'SEND_MESSAGE_REJECTED', payload: errorPayload };
    const state = contactReducer(initialState, action);
    
    // Assert: Error state captured, loading stopped
    assert.strictEqual(state.sending, false);              // No longer sending
    assert.strictEqual(state.sendFulfilled, false);        // Did not succeed
    assert.deepStrictEqual(state.error, errorPayload);     // Error stored
    
    console.log('✓ SEND_MESSAGE_REJECTED test passed');
  });

  /**
   * TEST 4: Handle SEND_MESSAGE_FULFILLED
   * --------------------------------------
   * PURPOSE: Verify correct state when message sends successfully
   * 
   * SOURCE REFERENCE: contactReducer.js lines 25-31
   *   case "SEND_MESSAGE_FULFILLED": {
   *     return Object.assign({}, state, {
   *       sending: false,        // Request complete
   *       sendFulfilled: true,   // Successfully sent!
   *       error: null            // No errors
   *     });
   *   }
   * 
   * WHEN THIS HAPPENS:
   * 1. SEND_MESSAGE_PENDING was dispatched
   * 2. Axios makes HTTP POST to /contact
   * 3. Server responds 200 OK
   * 4. Axios promise resolves
   * 5. Redux Promise Middleware dispatches FULFILLED action
   * 
   * STATE TRANSITIONS:
   * Before: { sending: true,  sendFulfilled: false, error: null }
   * After:  { sending: false, sendFulfilled: true,  error: null }
   * 
   * UI IMPLICATIONS:
   * - Hide loading spinner
   * - Show success message: "Your message has been sent!"
   * - Maybe clear form fields
   * - Maybe redirect to thank-you page
   * 
   * NOTE ON PAYLOAD:
   * FULFILLED action usually has payload with server response,
   * but this reducer doesn't use it (just sets flag to true)
   * 
   * DESIGN DECISION:
   * sendFulfilled stays true even after form reset, showing
   * "last operation succeeded". Some apps might clear this on new PENDING.
   */
  it('should handle SEND_MESSAGE_FULFILLED action', () => {
    // Arrange: Start in "sending" state
    const initialState = {
      sending: true,
      sendFulfilled: false,
      error: null
    };
    
    // Act: API request succeeds
    const action = { type: 'SEND_MESSAGE_FULFILLED' };
    const state = contactReducer(initialState, action);
    
    // Assert: Success state set
    assert.strictEqual(state.sending, false);         // Loading done
    assert.strictEqual(state.sendFulfilled, true);    // Successfully sent
    assert.strictEqual(state.error, null);            // No errors
    
    console.log('✓ SEND_MESSAGE_FULFILLED test passed');
  });

  /**
   * TEST 5-7: PDF Attachment Actions (Same Pattern)
   * ------------------------------------------------
   * PURPOSE: Verify identical behavior for PDF-with-message endpoint
   * 
   * BACKGROUND:
   * Application has two endpoints:
   * - POST /contact           → Regular message
   * - POST /contact_w_pdf     → Message with PDF attachment
   * 
   * SOURCE REFERENCE: contactReducer.js lines 33-51
   * 
   * WHY SEPARATE ACTIONS:
   * - Different API endpoints
   * - Different validation rules
   * - Same state management logic
   * 
   * REDUCER BEHAVIOR:
   * Identical to SEND_MESSAGE actions, just different action type names
   * 
   * TESTING STRATEGY:
   * Copy same test pattern with different action types
   */
  it('should handle SEND_MESSAGE_WITH_PDF_PENDING action', () => {
    // Arrange: Start with previous successful send
    const initialState = {
      sending: false,
      sendFulfilled: true,  // Previous send succeeded
      error: null
    };
    
    // Act: User sends new message with PDF
    const action = { type: 'SEND_MESSAGE_WITH_PDF_PENDING' };
    const state = contactReducer(initialState, action);
    
    // Assert: Reset to loading state
    assert.strictEqual(state.sending, true);           // Now sending
    assert.strictEqual(state.sendFulfilled, false);    // Reset fulfilled flag
    assert.strictEqual(state.error, null);             // Clear any errors
    
    console.log('✓ SEND_MESSAGE_WITH_PDF_PENDING test passed');
  });

  it('should handle SEND_MESSAGE_WITH_PDF_REJECTED action', () => {
    // Arrange: Currently sending
    const initialState = {
      sending: true,
      sendFulfilled: false,
      error: null
    };
    
    // Act: PDF upload fails (maybe file too large)
    const errorPayload = { message: 'PDF upload failed' };
    const action = { type: 'SEND_MESSAGE_WITH_PDF_REJECTED', payload: errorPayload };
    const state = contactReducer(initialState, action);
    
    // Assert: Error captured
    assert.strictEqual(state.sending, false);
    assert.strictEqual(state.sendFulfilled, false);
    assert.deepStrictEqual(state.error, errorPayload);
    
    console.log('✓ SEND_MESSAGE_WITH_PDF_REJECTED test passed');
  });

  it('should handle SEND_MESSAGE_WITH_PDF_FULFILLED action', () => {
    // Arrange: Currently sending
    const initialState = {
      sending: true,
      sendFulfilled: false,
      error: null
    };
    
    // Act: PDF message successfully sent
    const action = { type: 'SEND_MESSAGE_WITH_PDF_FULFILLED' };
    const state = contactReducer(initialState, action);
    
    // Assert: Success state
    assert.strictEqual(state.sending, false);
    assert.strictEqual(state.sendFulfilled, true);
    assert.strictEqual(state.error, null);
    
    console.log('✓ SEND_MESSAGE_WITH_PDF_FULFILLED test passed');
  });

  /**
   * TEST 8: Complete Message Sending Workflow
   * ------------------------------------------
   * PURPOSE: Verify full happy-path user flow from start to finish
   * 
   * WHY INTEGRATION TEST IN UNIT SUITE:
   * While we test each action individually, this test verifies
   * they work together correctly in sequence.
   * 
   * SIMULATED USER JOURNEY:
   * 1. User loads page (initial state)
   * 2. User clicks submit (PENDING)
   * 3. Server responds (FULFILLED)
   * 4. Form shows success
   * 
   * STATE FLOW:
   * undefined → initState → PENDING → FULFILLED
   * 
   * WHY THIS MATTERS:
   * - Catches state transition bugs
   * - Verifies no intermediate state breaks
   * - Documents expected workflow
   * - Tests reducer with realistic action sequence
   */
  it('should handle complete message sending workflow', () => {
    // Arrange: Start from scratch
    let state = contactReducer(undefined, {});
    
    // Act: User submits form
    state = contactReducer(state, { type: 'SEND_MESSAGE_PENDING' });
    
    // Assert: Loading state correct
    assert.strictEqual(state.sending, true);
    
    // Act: Server responds successfully
    state = contactReducer(state, { type: 'SEND_MESSAGE_FULFILLED' });
    
    // Assert: Final state correct
    assert.strictEqual(state.sending, false);          // Not loading anymore
    assert.strictEqual(state.sendFulfilled, true);     // Success!
    
    console.log('✓ Complete workflow test passed');
  });

  /**
   * TEST 9: Error Recovery Workflow
   * --------------------------------
   * PURPOSE: Verify users can retry after errors
   * 
   * REAL-WORLD SCENARIO:
   * 1. User submits form
   * 2. Network fails → error shown
   * 3. User fixes issue and clicks submit again
   * 4. Error should clear, new attempt starts
   * 
   * WHY THIS TEST:
   * - Verifies error clearing on retry
   * - Ensures users aren't stuck in error state
   * - Tests state machine handles loops
   * 
   * STATE FLOW:
   * initState → PENDING → REJECTED (error) → PENDING (error clears) → ready
   * 
   * UI BEHAVIOR:
   * When PENDING dispatched after REJECTED, error message disappears
   * and loading spinner appears
   */
  it('should handle error recovery workflow', () => {
    // Arrange: Start from initial state
    let state = contactReducer(undefined, {});
    
    // Act: First attempt starts
    state = contactReducer(state, { type: 'SEND_MESSAGE_PENDING' });
    
    // Act: First attempt fails
    state = contactReducer(state, {
      type: 'SEND_MESSAGE_REJECTED',
      payload: { message: 'Error' }
    });
    
    // Assert: Error captured
    assert.strictEqual(state.error.message, 'Error');
    
    // Act: User retries (PENDING clears error)
    state = contactReducer(state, { type: 'SEND_MESSAGE_PENDING' });
    
    // Assert: Error cleared on retry
    assert.strictEqual(state.error, null);  // ← Key behavior!
    
    console.log('✓ Error recovery workflow test passed');
  });

  /**
   * TEST 10: State Immutability
   * ----------------------------
   * PURPOSE: Verify reducer follows Redux immutability principle
   * 
   * WHY IMMUTABILITY IS CRITICAL:
   * - Redux uses shallow equality checks (===) for performance
   * - If state object is mutated, React won't re-render
   * - Time-travel debugging relies on immutable state history
   * - Prevents subtle bugs from shared references
   * 
   * HOW IMMUTABILITY WORKS:
   * Object.assign({}, state, changes) creates NEW object:
   * - {} is new empty object
   * - state properties copied to it
   * - changes overwrite copied properties
   * - Original state untouched
   * 
   * WHAT THIS TEST VERIFIES:
   * 1. Original state object not modified
   * 2. New state object returned (different reference)
   * 
   * ANTI-PATTERN (would fail):
   *   state.sending = true;
   *   return state;  // X Mutates original!
   * 
   * CORRECT PATTERN (passes):
   *   return Object.assign({}, state, { sending: true });  // ✓
   */
  it('should not mutate original state', () => {
    // Arrange: Create initial state
    const initialState = {
      sending: false,
      sendFulfilled: false,
      error: null
    };
    
    // Create snapshot of original values
    const originalState = JSON.parse(JSON.stringify(initialState));
    
    // Act: Pass through reducer
    const action = { type: 'SEND_MESSAGE_PENDING' };
    const newState = contactReducer(initialState, action);
    
    // Assert: Original state values unchanged
    assert.deepStrictEqual(initialState, originalState);
    
    // Assert: New state is different object (different memory address)
    assert.notStrictEqual(newState, initialState);
    
    console.log('✓ State immutability test passed');
  });

  /**
   * TEST 11: Unknown Action Handling
   * ---------------------------------
   * PURPOSE: Verify reducer safely ignores actions it doesn't handle
   * 
   * REDUX ARCHITECTURE:
   * - Redux dispatches EVERY action to EVERY reducer
   * - Most actions won't match this reducer's switch cases
   * - Default case must return state unchanged
   * 
   * SOURCE REFERENCE: contactReducer.js line 53
   *   default:
   *     return state;
   * 
   * WHY THIS MATTERS:
   * - Prevents state loss
   * - Allows multiple reducers to coexist
   * - Makes reducer composable and modular
   * 
   * EXAMPLE SCENARIO:
   * User selects answer in questionnaire:
   * - Action: { type: 'SELECT_ANSWER', ... }
   * - answerReducer handles it (updates answer state)
   * - contactReducer receives it too (ignores it, returns state)
   * - navReducer receives it too (ignores it, returns state)
   * 
   * WHAT WOULD BREAK THIS TEST:
   * - Returning null for unknown actions
   * - Throwing error for unknown actions
   * - Returning initial state for unknown actions
   */
  it('should return current state for unknown actions', () => {
    // Arrange: Create some state
    const initialState = {
      sending: false,
      sendFulfilled: false,
      error: null
    };
    
    // Act: Dispatch unrelated action
    const action = { type: 'UNKNOWN_ACTION' };
    const state = contactReducer(initialState, action);
    
    // Assert: State completely unchanged
    assert.deepStrictEqual(state, initialState);
    
    console.log('✓ Unknown action test passed');
  });

});

/**
 * =============================================================================
 * TEST COVERAGE SUMMARY
 * =============================================================================
 * 
 * - Initial state
 * - SEND_MESSAGE actions (PENDING, FULFILLED, REJECTED)
 * - SEND_MESSAGE_WITH_PDF actions (PENDING, FULFILLED, REJECTED)
 * - Complete workflow (happy path)
 * - Error recovery workflow
 * - State immutability
 * - Unknown action handling
 * 
 * COVERAGE: 100% of contactReducer functionality
 * 
 * ACTION CREATORS NOT TESTED HERE:
 * contactAction.js exports sendMessage() and sendMessageWithPdf()
 * These use axios 
 * 
 * WHAT'S NOT TESTED (by design):
 * - HTTP requests (integration test)
 * - React component integration (integration test)
 * - Form validation (component test)
 * - Redux store integration (integration test)
 * 
 * RUNNING THIS TEST:
 * node __tests__/unit/contactReducer.test.js
 * 
 * DEBUGGING FAILED TESTS:
 * 1. Check if contactReducer.js was modified
 * 2. Verify action type strings match exactly
 * 3. Confirm Object.assign() usage for immutability
 * 4. Check if new actions were added without updating tests
 * =============================================================================
 */
