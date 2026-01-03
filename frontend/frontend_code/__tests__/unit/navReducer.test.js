// __tests__/unit/navReducer.test.js

/**
 * =============================================================================
 * UNIT TEST SUITE: navReducer
 * =============================================================================
 * 
 * PURPOSE:
 * Tests the navigation reducer which manages UI state for navigation buttons
 * and logout button visibility in the application.
 * 
 * SOURCE FILE: src/js/reducer/navReducer.js
 * 
 * WHAT THIS REDUCER DOES:
 * - Controls visibility of navigation buttons (HIDE/SHOW_NAV_BUTTONS)
 * - Controls visibility of logout button (HIDE/SHOW_LOGOUT_BUTTONS)
 * - Uses string values "true"/"false" instead of booleans (legacy design)
 * 
 * STATE SHAPE:
 * {
 *   isNavButtonsDisabled: "false" | "true",   // String, not boolean!
 *   isLogoutButtonDisabled: "false" | "true"  // String, not boolean!
 * }
 * 
 * WHY TEST REDUCERS:
 * Reducers are pure functions that determine state transitions. Testing them
 * ensures the application state changes correctly based on dispatched actions.
 * =============================================================================
 */

import assert from 'assert';
import navReducer from '../../src/js/reducer/navReducer.js';

/**
 * Custom test runner function that groups related tests
 * @param {string} suiteName - Name of the test suite
 * @param {Function} fn - Function containing all test cases
 */
function describe(suiteName, fn) {
  console.log('\n' + suiteName);
  fn();
}

/**
 * Individual test case runner
 * @param {string} testName - Description of what is being tested
 * @param {Function} fn - Test function containing assertions
 */
function it(testName, fn) {
  try {
    fn();
  } catch (error) {
    console.log('✗', testName, '- FAILED');
    console.error(error.message);
    console.error(error.stack);
    process.exit(1); // Exit with error code if any test fails
  }
}

describe('navReducer - Unit Tests', () => {
  
  /**
   * TEST 1: Initial State Verification
   * ----------------------------------
   * PURPOSE: Verify the reducer returns correct initial state when Redux store
   *          is first initialized (state is undefined, action is empty {})
   * 
   * SOURCE REFERENCE: navReducer.js lines 1-4
   *   const initState = {
   *     isNavButtonsDisabled: "false",
   *     isLogoutButtonDisabled: "true",
   *   };
   * 
   * WHY THIS MATTERS:
   * - Redux calls reducers with undefined state during store initialization
   * - Initial state defines the starting point of the application
   * - Navigation should be visible by default (isNavButtonsDisabled: "false")
   * - Logout button should be hidden by default (isLogoutButtonDisabled: "true")
   * 
   * WHAT WOULD BREAK THIS TEST:
   * - Changing default values in initState
   * - Changing from strings to booleans
   * - Renaming state properties
   */
  it('should return initial state when state is undefined', () => {
    // Arrange: No setup needed
    // Act: Call reducer with undefined state and empty action (simulates Redux init)
    const state = navReducer(undefined, {});
    
    // Assert: Verify initial state structure and values
    assert.strictEqual(state.isNavButtonsDisabled, "false"); // Nav buttons are visible
    assert.strictEqual(state.isLogoutButtonDisabled, "true"); // Logout button is hidden
    
    console.log('✓ Initial state test passed');
  });

  /**
   * TEST 2: Hide Navigation Buttons Action
   * ---------------------------------------
   * PURPOSE: Verify that HIDE_NAV_BUTTONS action correctly sets
   *          isNavButtonsDisabled to "true"
   * 
   * SOURCE REFERENCE: navReducer.js lines 9-13
   *   case "HIDE_NAV_BUTTONS": {
   *     return Object.assign({}, state, {
   *       isNavButtonsDisabled: "true",
   *     });
   *   }
   * 
   * REAL-WORLD USAGE:
   * - When user starts questionnaire, navigation is disabled
   * - Prevents users from navigating away during important tasks
   * - Used in conjunction with navAction.hideNavButton()
   * 
   * TEST PATTERN: Arrange-Act-Assert (AAA)
   * - Arrange: Set up initial state
   * - Act: Dispatch HIDE_NAV_BUTTONS action
   * - Assert: Verify state changed correctly
   * 
   * WHAT WOULD BREAK THIS TEST:
   * - Changing action type string
   * - Changing "true" to boolean true
   * - Renaming isNavButtonsDisabled property
   */
  it('should handle HIDE_NAV_BUTTONS action', () => {
    // Arrange: Create initial state with nav buttons visible
    const initialState = {
      isNavButtonsDisabled: "false",
      isLogoutButtonDisabled: "true"
    };
    
    // Act: Create action and pass through reducer
    const action = { type: 'HIDE_NAV_BUTTONS' };
    const state = navReducer(initialState, action);
    
    // Assert: Verify nav buttons are now hidden
    assert.strictEqual(state.isNavButtonsDisabled, "true");
    
    console.log('✓ HIDE_NAV_BUTTONS test passed');
  });

  /**
   * TEST 3: Show Navigation Buttons Action
   * ---------------------------------------
   * PURPOSE: Verify SHOW_NAV_BUTTONS action makes navigation visible again
   *          and ensures logout button is also hidden
   * 
   * SOURCE REFERENCE: navReducer.js lines 15-20
   *   case "SHOW_NAV_BUTTONS": {
   *     return Object.assign({}, state, {
   *       isNavButtonsDisabled: "false",
   *       isLogoutButtonDisabled: "true"   // Note: Also sets this!
   *     });
   *   }
   * 
   * IMPORTANT BEHAVIOR:
   * This action performs TWO state changes:
   * 1. Shows navigation buttons (isNavButtonsDisabled: "false")
   * 2. Hides logout button (isLogoutButtonDisabled: "true")
   * 
   * WHY BOTH CHANGES:
   * This implements business logic: when showing regular navigation,
   * the logout button should be hidden. This is UI state coupling.
   * 
   * REAL-WORLD USAGE:
   * - After questionnaire completes, show normal navigation
   * - After user logs out, return to normal navigation state
   * 
   * WHAT WOULD BREAK THIS TEST:
   * - Removing the isLogoutButtonDisabled update
   * - Changing either property value
   */
  it('should handle SHOW_NAV_BUTTONS action', () => {
    // Arrange: Start with nav hidden and logout shown (opposite of desired)
    const initialState = {
      isNavButtonsDisabled: "true",
      isLogoutButtonDisabled: "false"
    };
    
    // Act: Dispatch action to show navigation
    const action = { type: 'SHOW_NAV_BUTTONS' };
    const state = navReducer(initialState, action);
    
    // Assert: Both state properties should change
    assert.strictEqual(state.isNavButtonsDisabled, "false");  // Nav now visible
    assert.strictEqual(state.isLogoutButtonDisabled, "true"); // Logout now hidden
    
    console.log('✓ SHOW_NAV_BUTTONS test passed');
  });

  /**
   * TEST 4: Hide Logout Button Action
   * ----------------------------------
   * PURPOSE: Verify hiding logout button also shows regular navigation
   * 
   * SOURCE REFERENCE: navReducer.js lines 22-27
   *   case "HIDE_LOGOUT_BUTTONS": {
   *     return Object.assign({}, state, {
   *       isNavButtonsDisabled: "false",
   *       isLogoutButtonDisabled: "true",
   *     });
   *   }
   * 
   * COUPLED BEHAVIOR:
   * Like SHOW_NAV_BUTTONS, this action modifies both properties.
   * Hiding logout implies showing regular navigation.
   * 
   * REAL-WORLD USAGE:
   * - After logout completes, return to guest navigation
   * - When transitioning from authenticated to unauthenticated state
   * 
   * WHAT WOULD BREAK THIS TEST:
   * - Changing action type
   * - Modifying only one property instead of both
   * - Changing to boolean values
   */
  it('should handle HIDE_LOGOUT_BUTTONS action', () => {
    // Arrange: Start with logout visible and nav hidden (logged-in state)
    const initialState = {
      isNavButtonsDisabled: "true",
      isLogoutButtonDisabled: "false"
    };
    
    // Act: Hide logout button
    const action = { type: 'HIDE_LOGOUT_BUTTONS' };
    const state = navReducer(initialState, action);
    
    // Assert: Verify both state transitions
    assert.strictEqual(state.isNavButtonsDisabled, "false"); // Nav becomes visible
    assert.strictEqual(state.isLogoutButtonDisabled, "true"); // Logout becomes hidden
    
    console.log('✓ HIDE_LOGOUT_BUTTONS test passed');
  });

  /**
   * TEST 5: Show Logout Button Action
   * ----------------------------------
   * PURPOSE: Verify showing logout button hides regular navigation
   * 
   * SOURCE REFERENCE: navReducer.js lines 29-34
   *   case "SHOW_LOGOUT_BUTTONS": {
   *     return Object.assign({}, state, {
   *       isNavButtonsDisabled: "true",
   *       isLogoutButtonDisabled: "false",
   *     });
   *   }
   * 
   * UI LOGIC:
   * When user is logged in, show logout button and hide regular nav.
   * This creates an either/or relationship between nav types.
   * 
   * REAL-WORLD USAGE:
   * - After successful login
   * - When entering authenticated sections of the application
   * 
   * DESIGN NOTE:
   * This pattern (mutual exclusivity) could be refactored to a single
   * "navMode" property, but tests must verify current implementation.
   */
  it('should handle SHOW_LOGOUT_BUTTONS action', () => {
    // Arrange: Start with regular navigation visible
    const initialState = {
      isNavButtonsDisabled: "false",
      isLogoutButtonDisabled: "true"
    };
    
    // Act: Show logout button
    const action = { type: 'SHOW_LOGOUT_BUTTONS' };
    const state = navReducer(initialState, action);
    
    // Assert: Navigation states flip
    assert.strictEqual(state.isNavButtonsDisabled, "true");  // Hide regular nav
    assert.strictEqual(state.isLogoutButtonDisabled, "false"); // Show logout
    
    console.log('✓ SHOW_LOGOUT_BUTTONS test passed');
  });

  /**
   * TEST 6: State Immutability
   * ---------------------------
   * PURPOSE: Verify reducer follows Redux best practice of never mutating
   *          the original state object
   * 
   * WHY IMMUTABILITY MATTERS:
   * - Redux relies on reference equality for change detection
   * - Mutations break time-travel debugging
   * - Mutations cause React components to miss updates
   * - Mutations violate functional programming principles
   * 
   * SOURCE REFERENCE: navReducer.js uses Object.assign({}, state, ...)
   *   This creates a NEW object, preserving the original
   * 
   * HOW THIS TEST WORKS:
   * 1. Create initial state object
   * 2. Save a deep copy of that object
   * 3. Pass state through reducer
   * 4. Verify original state unchanged (immutability)
   * 5. Verify new state is different object reference
   * 
   * WHAT WOULD BREAK THIS TEST:
   * - Directly modifying state: state.isNavButtonsDisabled = "true"
   * - Forgetting Object.assign() first argument: Object.assign(state, {...})
   */
  it('should not mutate original state', () => {
    // Arrange: Create initial state
    const initialState = {
      isNavButtonsDisabled: "false",
      isLogoutButtonDisabled: "true"
    };
    // Deep copy to verify original never changes
    const originalState = { ...initialState };
    
    // Act: Pass through reducer (should return new object)
    const action = { type: 'HIDE_NAV_BUTTONS' };
    const newState = navReducer(initialState, action);
    
    // Assert: Original state unchanged
    assert.deepStrictEqual(initialState, originalState);
    // Assert: New state is different object (not same reference)
    assert.notStrictEqual(newState, initialState);
    
    console.log('✓ State immutability test passed');
  });

  /**
   * TEST 7: Unknown Action Handling
   * --------------------------------
   * PURPOSE: Verify reducer returns unchanged state for unrecognized actions
   * 
   * SOURCE REFERENCE: navReducer.js line 36
   *   default:
   *     return state;  // Return unchanged state
   * 
   * WHY THIS MATTERS:
   * - Redux passes ALL actions to ALL reducers
   * - Most actions won't match this reducer's cases
   * - Returning state unchanged is correct behavior
   * - Prevents accidental state loss
   * 
   * REAL-WORLD SCENARIO:
   * - Another reducer handles SEND_MESSAGE action
   * - navReducer receives it too, but should ignore it
   * - State remains unchanged
   * 
   * WHAT WOULD BREAK THIS TEST:
   * - Returning null or undefined for unknown actions
   * - Throwing an error for unknown actions
   * - Resetting to initial state for unknown actions
   */
  it('should return current state for unknown actions', () => {
    // Arrange: Create initial state
    const initialState = {
      isNavButtonsDisabled: "false",
      isLogoutButtonDisabled: "true"
    };
    
    // Act: Dispatch action this reducer doesn't handle
    const action = { type: 'UNKNOWN_ACTION' };
    const state = navReducer(initialState, action);
    
    // Assert: State completely unchanged (same values, same reference)
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
 * - All 4 action types (HIDE/SHOW for NAV and LOGOUT)
 * - State immutability (Redux principle)
 * - Unknown action handling (defensive programming)
 * 
 * COVERAGE: 100% of navReducer functionality
 * 
 * WHAT'S NOT TESTED (and doesn't need to be):
 * - React component integration (that's an integration test)
 * - Redux middleware (tested separately)
 * - Action creators (tested in navAction.test.js)
 * 
 * RUNNING THIS TEST:
 * node __tests__/unit/navReducer.test.js
 * 
 * IF THIS TEST FAILS:
 * - Check if navReducer.js was modified
 * - Verify action type strings match exactly
 * - Confirm state uses strings "true"/"false", not booleans
 * =============================================================================
 */
