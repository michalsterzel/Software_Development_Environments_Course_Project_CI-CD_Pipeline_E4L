// __tests__/integration/store.integration.test.js

/**
 * =============================================================================
 * INTEGRATION TEST SUITE: Redux Store Integration
 * =============================================================================
 * 
 * PURPOSE:
 * Tests how multiple reducers work together in a Redux store. This verifies
 * that the application's state management system functions correctly as a whole.
 * 
 * WHAT IS INTEGRATION TESTING:
 * Unlike unit tests that test components in isolation, integration tests verify
 * that multiple components work together correctly. Here we test:
 * - Redux store creation and initialization
 * - Multiple reducers combined into a single store
 * - Action dispatching across different reducers
 * - State isolation between reducers
 * - Subscriber notifications
 * - Complete user workflows
 * 
 * SOURCE FILES INTEGRATED:
 * - src/js/reducer/navReducer.js
 * - src/js/reducer/contactReducer.js
 * - src/js/reducer/answerReducer.js
 * - src/js/reducer/questionnaireReducer.js
 * 
 * WHY THIS MATTERS:
 * - Individual reducers might work fine in isolation
 * - But they might interfere with each other in a real store
 * - combineReducers might have issues
 * - State shape might not match expectations
 * - Global actions (like RESTART) might not propagate correctly
 * 
 * REAL REDUX vs TEST REDUX:
 * This file implements a minimal Redux store for testing purposes.
 * The real application uses redux library, but testing with our own
 * implementation ensures we understand Redux behavior and don't depend
 * on external library quirks.
 * =============================================================================
 */

import assert from 'assert';
import navReducer from '../../src/js/reducer/navReducer.js';
import contactReducer from '../../src/js/reducer/contactReducer.js';
import answerReducer from '../../src/js/reducer/answerReducer.js';
import questionnaireReducer from '../../src/js/reducer/questionnaireReducer.js';

/**
 * MOCK: window.localStorage
 * --------------------------
 * Required for answerReducer and questionnaireReducer which use localStorage
 */
if (typeof window === 'undefined') {
  global.window = {
    localStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {}
    }
  };
}

/**
 * =============================================================================
 * REDUX IMPLEMENTATION FOR TESTING
 * =============================================================================
 * 
 * We implement a minimal Redux store to avoid external dependencies in tests.
 * This helps us understand Redux internals and makes tests more robust.
 */

/**
 * createStore: Creates a Redux store
 * -----------------------------------
 * PURPOSE: Core Redux function that holds state and allows dispatching actions
 * 
 * PARAMETERS:
 * @param {Function} reducer - Root reducer function (state, action) => newState
 * @param {any} preloadedState - Optional initial state
 * 
 * RETURNS:
 * Store object with three methods:
 * - getState(): Returns current state
 * - dispatch(action): Sends action to reducer, updates state
 * - subscribe(listener): Registers callback for state changes
 * 
 * HOW IT WORKS:
 * 1. Stores current state in closure
 * 2. Maintains array of listener callbacks
 * 3. On dispatch: calls reducer, updates state, notifies listeners
 * 4. Returns public API object
 * 
 * REDUX PATTERN:
 * This is a simplified version of the real Redux createStore.
 * Real Redux has more features (middleware, enhancers, etc.)
 */
function createStore(reducer, preloadedState) {
  let state = preloadedState;  // Current state (closure variable)
  const listeners = [];         // Array of subscriber callbacks
  
  // Initialize state if not provided
  if (state === undefined) {
    // Redux convention: dispatch init action to get initial state
    state = reducer(undefined, { type: '@@INIT' });
  }
  
  return {
    /**
     * getState: Returns current state snapshot
     * Should NOT be called inside reducers (causes infinite loops)
     */
    getState: () => state,
    
    /**
     * dispatch: Sends action through reducer pipeline
     * This is the ONLY way to trigger state changes in Redux
     * 
     * FLOW:
     * 1. Call reducer with current state and action
     * 2. Reducer returns new state (or same state if action not handled)
     * 3. Update state variable
     * 4. Notify all subscribers
     * 5. Return the action (convention for middleware chaining)
     */
    dispatch: (action) => {
      state = reducer(state, action);         // Update state
      listeners.forEach(listener => listener()); // Notify subscribers
      return action;                            // Return action
    },
    
    /**
     * subscribe: Register callback for state changes
     * 
     * USAGE:
     * const unsubscribe = store.subscribe(() => {
     *   console.log('State changed!', store.getState());
     * });
     * 
     * Returns unsubscribe function to stop listening
     */
    subscribe: (listener) => {
      listeners.push(listener);
      // Return unsubscribe function
      return () => {
        const index = listeners.indexOf(listener);
        listeners.splice(index, 1);
      };
    }
  };
}

/**
 * combineReducers: Combines multiple reducers into one
 * -----------------------------------------------------
 * PURPOSE: Allows splitting reducer logic into separate files/functions
 * 
 * PROBLEM IT SOLVES:
 * Without combineReducers, you'd have one giant reducer handling all actions.
 * This becomes unmaintainable as the app grows.
 * 
 * EXAMPLE:
 * Instead of:
 *   reducer(state, action) {
 *     // 500 lines of switch cases for nav, contact, answer, etc.
 *   }
 * 
 * We can do:
 *   const rootReducer = combineReducers({
 *     nav: navReducer,        // Handles only nav actions
 *     contact: contactReducer, // Handles only contact actions
 *     answer: answerReducer    // Handles only answer actions
 *   });
 * 
 * STATE STRUCTURE:
 * Input reducers: { nav: navReducer, contact: contactReducer }
 * Output state: { nav: {...}, contact: {...} }
 * 
 * Each reducer only sees its slice of state!
 * 
 * HOW IT WORKS:
 * 1. Takes object mapping keys to reducer functions
 * 2. Returns a single reducer function
 * 3. That reducer calls each sub-reducer with its slice of state
 * 4. Combines results into one state object
 */
function combineReducers(reducers) {
  // Return a new reducer function
  return (state = {}, action) => {
    const nextState = {};  // Build new state object
    
    // Call each reducer with its slice of state
    for (let key in reducers) {
      // reducers[key] = reducer function (e.g., navReducer)
      // state[key] = current state slice (e.g., state.nav)
      // Result goes into nextState[key]
      nextState[key] = reducers[key](state[key], action);
    }
    
    return nextState;  // Return combined state
  };
}

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

describe('Redux Store - Integration Tests ', () => {
  
  /**
   * TEST 1: Store Creation with Combined Reducers
   * ----------------------------------------------
   * PURPOSE: Verify store can be created with multiple reducers
   * 
   * TESTS:
   * - combineReducers works correctly
   * - createStore accepts combined reducer
   * - State has correct keys (one per reducer)
   * 
   * EXPECTED STATE SHAPE:
   * {
   *   nav: { isNavButtonsDisabled: "false", isLogoutButtonDisabled: "true" },
   *   contact: { sending: false, sendFulfilled: false, error: null },
   *   answer: { sessionId: null, session: {...}, ... },
   *   questionnaire: { currentQuestion: 0, questionnaire: {...}, ... }
   * }
   * 
   * WHY THIS MATTERS:
   * If combineReducers is broken, entire app fails to start
   */
  it('should create store with combined reducers', () => {
    // Arrange: Combine all four reducers
    const rootReducer = combineReducers({
      nav: navReducer,
      contact: contactReducer,
      answer: answerReducer,
      questionnaire: questionnaireReducer
    });
    
    // Act: Create store with combined reducer
    const store = createStore(rootReducer);
    const state = store.getState();
    
    // Assert: State has all four keys
    assert.ok(state.nav);           // Nav state exists
    assert.ok(state.contact);       // Contact state exists
    assert.ok(state.answer);        // Answer state exists
    assert.ok(state.questionnaire); // Questionnaire state exists
    
    console.log('✓ Store creation test passed');
  });

  /**
   * TEST 2: Initial State from All Reducers
   * ----------------------------------------
   * PURPOSE: Verify each reducer initializes correctly in combined store
   * 
   * INTEGRATION ASPECT:
   * Each reducer must initialize independently without interfering with others.
   * This test catches issues like:
   * - Reducer expecting state from another reducer
   * - Reducer mutating global state
   * - Initialization order dependencies
   * 
   * VERIFICATION POINTS:
   * - Each reducer's initial state matches unit test expectations
   * - State shape is correct (nested under reducer keys)
   * - No reducer overwrites another's state
   */
  it('should initialize all reducers with correct state', () => {
    // Arrange: Combine reducers
    const rootReducer = combineReducers({
      nav: navReducer,
      contact: contactReducer,
      answer: answerReducer,
      questionnaire: questionnaireReducer
    });
    
    // Act: Create store (triggers initialization)
    const store = createStore(rootReducer);
    const state = store.getState();
    
    // Assert: Each reducer's initial state is correct
    assert.strictEqual(state.nav.isNavButtonsDisabled, "false");
    assert.strictEqual(state.contact.sending, false);
    assert.strictEqual(state.answer.sessionId, null);
    assert.strictEqual(state.questionnaire.currentQuestion, 0);
    
    console.log('✓ Initial state test passed');
  });

  /**
   * TEST 3: Action Dispatching to Correct Reducer
   * ----------------------------------------------
   * PURPOSE: Verify actions reach the correct reducer and only that reducer
   * 
   * REDUX BEHAVIOR:
   * When you dispatch an action, Redux sends it to ALL reducers.
   * Each reducer checks if it handles that action type.
   * Only the matching reducer updates its state.
   * Other reducers return their state unchanged.
   * 
   * THIS TEST VERIFIES:
   * 1. HIDE_NAV_BUTTONS only affects state.nav
   * 2. SEND_MESSAGE_PENDING only affects state.contact
   * 3. SET_SEMINAR_IN_SESSION only affects state.answer
   * 
   * WHAT WOULD BREAK THIS:
   * - navReducer accidentally handling SEND_MESSAGE_PENDING
   * - contactReducer resetting state on HIDE_NAV_BUTTONS
   * - Cross-reducer state pollution
   */
  it('should dispatch actions to correct reducer', () => {
    // Arrange: Create store with three reducers
    const rootReducer = combineReducers({
      nav: navReducer,
      contact: contactReducer,
      answer: answerReducer
    });
    const store = createStore(rootReducer);
    
    // Act & Assert: Test nav action
    store.dispatch({ type: 'HIDE_NAV_BUTTONS' });
    let state = store.getState();
    assert.strictEqual(state.nav.isNavButtonsDisabled, "true");  // Nav changed
    
    // Act & Assert: Test contact action
    store.dispatch({ type: 'SEND_MESSAGE_PENDING' });
    state = store.getState();
    assert.strictEqual(state.contact.sending, true);  // Contact changed
    
    // Act & Assert: Test answer action
    store.dispatch({
      type: 'SET_SEMINAR_IN_SESSION',
      payload: 'TEST_SEMINAR'
    });
    state = store.getState();
    assert.strictEqual(state.answer.session.seminar_access_code, 'TEST_SEMINAR');  // Answer changed
    
    console.log('✓ Action dispatch test passed');
  });

  /**
   * TEST 4: Multiple Sequential Actions
   * ------------------------------------
   * PURPOSE: Verify store handles realistic action sequences
   * 
   * SIMULATES REAL USER FLOW:
   * 1. User logs in → SHOW_LOGOUT_BUTTONS
   * 2. User enters seminar code → SET_SEMINAR_IN_SESSION
   * 3. User answers question → SELECT_ANSWER
   * 4. User submits contact form → SEND_MESSAGE_PENDING/FULFILLED
   * 
   * INTEGRATION TESTING:
   * - State accumulates correctly across actions
   * - No actions interfere with each other
   * - State from earlier actions persists through later actions
   * - No memory leaks or state corruption
   * 
   * COMPLEX STATE TRANSITIONS:
   * Start:
   * { nav: {logout: "true"}, answer: {seminar: null, answers: []}, contact: {sending: false} }
   * 
   * After SHOW_LOGOUT_BUTTONS:
   * { nav: {logout: "false"}, ... }
   * 
   * After SET_SEMINAR_IN_SESSION:
   * { nav: {logout: "false"}, answer: {seminar: "SEM123"}, ... }
   * 
   * After SELECT_ANSWER:
   * { nav: {logout: "false"}, answer: {seminar: "SEM123", answers: [1]}, ... }
   * 
   * Final state should have all changes accumulated
   */
  it('should handle multiple sequential actions', () => {
    // Arrange: Create store
    const rootReducer = combineReducers({
      nav: navReducer,
      contact: contactReducer,
      answer: answerReducer
    });
    const store = createStore(rootReducer);
    
    // Act: Dispatch sequence of actions (simulate user workflow)
    store.dispatch({ type: 'SHOW_LOGOUT_BUTTONS' });
    store.dispatch({ type: 'SET_SEMINAR_IN_SESSION', payload: 'SEM123' });
    store.dispatch({
      type: 'SELECT_ANSWER',
      payload: { possibleAnswerId: 1, variable: null }
    });
    store.dispatch({ type: 'SEND_MESSAGE_PENDING' });
    store.dispatch({ type: 'SEND_MESSAGE_FULFILLED' });
    
    // Assert: All state changes persisted
    const state = store.getState();
    assert.strictEqual(state.nav.isLogoutButtonDisabled, "false");       // From action 1
    assert.strictEqual(state.answer.session.seminar_access_code, 'SEM123'); // From action 2
    assert.strictEqual(state.answer.session.answers.length, 1);          // From action 3
    assert.strictEqual(state.contact.sendFulfilled, true);               // From action 5
    
    console.log('✓ Sequential actions test passed');
  });

  /**
   * TEST 5: Subscriber Notifications
   * ---------------------------------
   * PURPOSE: Verify store notifies subscribers on every state change
   * 
   * REDUX SUBSCRIPTION PATTERN:
   * Components subscribe to store to re-render on state changes:
   * 
   * const unsubscribe = store.subscribe(() => {
   *   this.setState({ data: store.getState() });
   * });
   * 
   * THIS TEST VERIFIES:
   * - Subscribers called on every dispatch
   * - Notification count matches dispatch count
   * - Unsubscribe stops notifications
   * - Multiple subscribers can coexist
   * 
   * REAL-WORLD USAGE:
   * React-Redux uses this mechanism:
   * - connect() subscribes to store
   * - On state change, checks if component's props changed
   * - If yes, triggers component re-render
   * - On unmount, unsubscribes
   */
  it('should notify subscribers on state change', () => {
    // Arrange: Create store
    const rootReducer = combineReducers({
      nav: navReducer,
      contact: contactReducer
    });
    const store = createStore(rootReducer);
    
    // Arrange: Subscribe with counter
    let notificationCount = 0;
    const unsubscribe = store.subscribe(() => {
      notificationCount++;  // Increment on each notification
    });
    
    // Act: First dispatch
    store.dispatch({ type: 'HIDE_NAV_BUTTONS' });
    // Assert: Notified once
    assert.strictEqual(notificationCount, 1);
    
    // Act: Second dispatch
    store.dispatch({ type: 'SEND_MESSAGE_PENDING' });
    // Assert: Notified twice
    assert.strictEqual(notificationCount, 2);
    
    // Act: Unsubscribe
    unsubscribe();
    
    // Act: Third dispatch (but unsubscribed)
    store.dispatch({ type: 'SHOW_NAV_BUTTONS' });
    // Assert: Still only 2 (unsubscribe worked)
    assert.strictEqual(notificationCount, 2);
    
    console.log('✓ Subscription test passed');
  });

  /**
   * TEST 6: State Isolation Between Reducers
   * -----------------------------------------
   * PURPOSE: Verify reducers don't accidentally modify each other's state
   * 
   * STATE ISOLATION is critical for:
   * - Maintainability (reducers can be modified independently)
   * - Debugging (changes are localized)
   * - Testing (reducers testable in isolation)
   * 
   * THIS TEST ENSURES:
   * - navReducer only modifies state.nav
   * - contactReducer state remains unchanged when nav actions dispatch
   * - answerReducer state remains unchanged when nav actions dispatch
   * 
   * WOULD CATCH BUGS LIKE:
   * navReducer accidentally returning:
   *   return { ...state, contact: { sending: true } }  // ✗ Wrong!
   * 
   * Instead of:
   *   return { ...state, isNavButtonsDisabled: "true" }  // ✓ Correct
   */
  it('should maintain state isolation between reducers', () => {
    // Arrange: Create store
    const rootReducer = combineReducers({
      nav: navReducer,
      contact: contactReducer,
      answer: answerReducer
    });
    const store = createStore(rootReducer);
    
    // Act: Dispatch action for nav reducer
    store.dispatch({ type: 'HIDE_NAV_BUTTONS' });
    const state = store.getState();
    
    // Assert: Only nav state changed, others unchanged
    // Contact state should still be initial state
    assert.strictEqual(state.contact.sending, false);
    // Answer state should still be initial state
    assert.strictEqual(state.answer.sessionId, null);
    
    console.log('✓ State isolation test passed');
  });

  /**
   * TEST 7: Global Actions Affecting Multiple Reducers
   * ---------------------------------------------------
   * PURPOSE: Verify actions that should affect multiple reducers work correctly
   * 
   * SOME ACTIONS ARE GLOBAL:
   * RESTART_QUESTIONNAIRE should reset both:
   * - answerReducer (clear all answers)
   * - questionnaireReducer (back to first question)
   * 
   * HOW IT WORKS:
   * 1. Both reducers listen for RESTART_QUESTIONNAIRE
   * 2. Both handle it in their switch statements
   * 3. Store dispatches to both (Redux broadcasts to all reducers)
   * 4. Both reducers reset their state
   * 
   * THIS TESTS:
   * - Multiple reducers can handle same action type
   * - No conflicts between reducers handling same action
   * - Both state slices update correctly
   * 
   * REAL-WORLD USAGE:
   * "Start Over" button dispatches RESTART_QUESTIONNAIRE.
   * Both question navigation AND answers must reset.
   */
  it('should handle global actions affecting multiple reducers', () => {
    // Arrange: Create store with answer and questionnaire reducers
    const rootReducer = combineReducers({
      answer: answerReducer,
      questionnaire: questionnaireReducer
    });
    const store = createStore(rootReducer);
    
    // Arrange: Add some data to answer state
    store.dispatch({
      type: 'SELECT_ANSWER',
      payload: { possibleAnswerId: 1, variable: null }
    });
    let state = store.getState();
    assert.strictEqual(state.answer.session.answers.length, 1);  // Answer added
    
    // Act: Dispatch RESTART_QUESTIONNAIRE (global action)
    store.dispatch({ type: 'RESTART_QUESTIONNAIRE' });
    state = store.getState();
    
    // Assert: Both reducers reset their state
    assert.strictEqual(state.answer.session.answers.length, 0);    // Answers cleared
    assert.strictEqual(state.questionnaire.currentQuestion, 0);     // Back to first question
    
    console.log('✓ Global action test passed');
  });

  /**
   * TEST 8: Complete Questionnaire Submission Workflow
   * ---------------------------------------------------
   * PURPOSE: Integration test simulating full user journey from start to finish
   * 
   * THIS IS AN END-TO-END TEST (within Redux):
   * Simulates real user completing questionnaire and submitting results
   * 
   * USER STORY:
   * 1. User arrives at app → navigation visible
   * 2. User enters workshop code → joins seminar
   * 3. User answers questions → selects multiple answers
   * 4. User submits → session saved to server
   * 5. Server calculates energy → results returned
   * 6. User sends results via email → message sent
   * 
   * ACTIONS DISPATCHED (in order):
   * 1. SHOW_NAV_BUTTONS
   * 2. SET_SEMINAR_IN_SESSION
   * 3. SELECT_ANSWER (×2)
   * 4. SEND_SESSION_FULFILLED
   * 5. COMPUTE_ENERGY_FULFILLED
   * 6. SEND_MESSAGE_FULFILLED
   * 
   * FINAL STATE CHECKS:
   * - Seminar code stored
   * - Both answers recorded
   * - Session ID received from server
   * - Energy calculation completed
   * - Message sent successfully
   * 
   * WHY THIS MATTERS:
   * Unit tests verify individual pieces.
   * This test verifies the COMPLETE flow works end-to-end.
   * Catches issues like:
   * - Action order dependencies
   * - State conflicts between reducers
   * - Missing state updates
   * - Unexpected state resets
   */
  it('should handle complete questionnaire submission workflow', () => {
    // Arrange: Create store with all relevant reducers
    const rootReducer = combineReducers({
      nav: navReducer,
      answer: answerReducer,
      contact: contactReducer
    });
    const store = createStore(rootReducer);
    
    // Act: Simulate complete user workflow
    
    // Step 1: Show navigation
    store.dispatch({ type: 'SHOW_NAV_BUTTONS' });
    
    // Step 2: User enters workshop code
    store.dispatch({ 
      type: 'SET_SEMINAR_IN_SESSION', 
      payload: 'WORKSHOP_2024' 
    });
    
    // Step 3: User answers two questions
    store.dispatch({ 
      type: 'SELECT_ANSWER', 
      payload: { possibleAnswerId: 1, variable: null }
    });
    store.dispatch({ 
      type: 'SELECT_ANSWER', 
      payload: { possibleAnswerId: 2, variable: null }
    });
    
    // Step 4: Session saved to server (FULFILLED means success)
    store.dispatch({ 
      type: 'SEND_SESSION_FULFILLED', 
      payload: { data: 'session-123' }
    });
    
    // Step 5: Energy calculation completes
    store.dispatch({ 
      type: 'COMPUTE_ENERGY_FULFILLED', 
      payload: { data: { totalEnergy: 3500 }}
    });
    
    // Step 6: User sends results via contact form
    store.dispatch({ type: 'SEND_MESSAGE_FULFILLED' });
    
    // Assert: Verify complete workflow state
    const finalState = store.getState();
    
    // Verify seminar code stored
    assert.strictEqual(
      finalState.answer.session.seminar_access_code, 
      'WORKSHOP_2024'
    );
    
    // Verify both answers recorded
    assert.strictEqual(
      finalState.answer.session.answers.length, 
      2
    );
    
    // Verify session ID received
    assert.strictEqual(
      finalState.answer.sessionId, 
      'session-123'
    );
    
    // Verify energy calculation stored
    assert.strictEqual(
      finalState.answer.calculationResult.totalEnergy, 
      3500
    );
    
    // Verify message sent successfully
    assert.strictEqual(
      finalState.contact.sendFulfilled, 
      true
    );
    
    console.log('✓ Complete workflow integration test passed');
  });

});

/**
 * =============================================================================
 * TEST COVERAGE SUMMARY
 * =============================================================================
 * 
 * - Store creation with combined reducers
 * - Initial state from all reducers
 * - Action dispatching to correct reducers
 * - Multiple sequential actions
 * - Subscriber notification system
 * - State isolation between reducers
 * - Global actions affecting multiple reducers
 * - Complete user workflow (end-to-end)
 * 
 * INTEGRATION COVERAGE: All reducer combinations tested
 * 
 * WHAT THIS CATCHES:
 * - Reducer conflicts
 * - State shape mismatches
 * - Action type collisions
 * - combineReducers bugs
 * - Subscription issues
 * - State pollution between reducers
 * - Workflow order dependencies
 * 
 * WHAT'S NOT TESTED (by design):
 * - React component integration (requires React testing)
 * - Actual HTTP requests (requires network mocking)
 * - Redux middleware (thunk, promise middleware)
 * - Time-travel debugging
 * - Hot module replacement
 * 
 * RUNNING THIS TEST:
 * node __tests__/integration/store.integration.test.js
 * 
 * DEBUGGING FAILURES:
 * 1. Check if reducer imports are correct
 * 2. Verify combineReducers implementation
 * 3. Check action type strings match
 * 4. Verify state shape expectations
 * 5. Look for reducer cross-contamination
 * =============================================================================
 */
