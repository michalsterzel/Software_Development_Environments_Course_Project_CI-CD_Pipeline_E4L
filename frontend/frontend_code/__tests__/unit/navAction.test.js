// __tests__/unit/navAction.test.js

/**
 * =============================================================================
 * UNIT TEST SUITE: navAction (Action Creators)
 * =============================================================================
 * 
 * PURPOSE:
 * Tests action creator functions that generate navigation-related Redux actions.
 * These are the only action creators that DON'T use axios, so we can import
 * and test them directly.
 * 
 * SOURCE FILE: src/js/action/navAction.js
 * 
 * WHAT ARE ACTION CREATORS:
 * Functions that return action objects. Instead of manually creating
 * { type: 'HIDE_NAV_BUTTONS', payload: {} } everywhere in the code,
 * we call hideNavButton() which returns that object.
 * 
 * BENEFITS:
 * - Centralized action creation (single source of truth)
 * - Prevents typos in action types
 * - Easier to refactor (change in one place)
 * - Better developer experience (autocomplete, type checking)
 * 
 * ACTION CREATORS IN THIS FILE:
 * - hideNavButton()     → HIDE_NAV_BUTTONS
 * - showNavButton()     → SHOW_NAV_BUTTONS
 * - hideLogoutButton()  → HIDE_LOGOUT_BUTTONS
 * - showLogoutButton()  → SHOW_LOGOUT_BUTTONS
 * 
 * WHY TEST ACTION CREATORS:
 * - Ensure they return correct action structure
 * - Verify action type strings are exact
 * - Catch breaking changes immediately
 * - Document expected behavior
 * =============================================================================
 */

import assert from 'assert';
import * as navActions from '../../src/js/action/navAction.js';

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

describe('navAction - Unit Tests ', () => {
  
  /**
   * TEST 1: Verify hideNavButton Exists and is a Function
   * ------------------------------------------------------
   * PURPOSE: Ensure the export exists and has correct type
   * 
   * SOURCE REFERENCE: navAction.js lines 1-7
   *   export function hideNavButton() { ... }
   * 
   * WHY TEST THIS:
   * - Catches accidental deletion of function
   * - Catches typos in function name
   * - Verifies ES6 export works correctly
   * - First line of defense before testing behavior
   * 
   * WHAT WOULD BREAK THIS TEST:
   * - Renaming function to hideNavigationButton()
   * - Changing to default export
   * - Removing export keyword
   * - Converting function to a constant
   */
  it('should export hideNavButton function', () => {
    // Assert: Verify function exists and is callable
    assert.strictEqual(typeof navActions.hideNavButton, 'function');
    console.log('✓ hideNavButton function exists');
  });

  /**
   * TEST 2: Verify hideNavButton Returns Correct Action
   * ----------------------------------------------------
   * PURPOSE: Test the actual behavior of hideNavButton() action creator
   * 
   * SOURCE REFERENCE: navAction.js lines 2-6
   *   return {
   *     type: "HIDE_NAV_BUTTONS",
   *     payload: {},
   *   };
   * 
   * ACTION STRUCTURE:
   * Redux actions must have a 'type' property (string).
   * They optionally have a 'payload' property (any data).
   * 
   * WHY EMPTY PAYLOAD:
   * This action doesn't need data - the type alone is sufficient.
   * However, code consistently includes payload: {} for uniformity.
   * 
   * HOW THIS PROTECTS THE APP:
   * - If someone changes "HIDE_NAV_BUTTONS" to "HIDE_NAV_BUTTON",
   *   this test fails immediately
   * - If someone removes payload, test catches it
   * - If function returns null/undefined, test fails
   * 
   * INTEGRATION POINT:
   * This action is consumed by navReducer.js which switches on action.type
   */
  it('should create HIDE_NAV_BUTTONS action', () => {
    // Act: Call the action creator
    const action = navActions.hideNavButton();
    
    // Assert: Verify action structure
    assert.strictEqual(action.type, 'HIDE_NAV_BUTTONS'); // Exact type match
    assert.ok(action.payload !== undefined); // Payload exists (even if empty)
    
    console.log('✓ hideNavButton creates correct action');
  });

  /**
   * TEST 3-4: Show Navigation Button Tests
   * ---------------------------------------
   * Same pattern as hideNavButton tests, but for showNavButton()
   * 
   * SOURCE REFERENCE: navAction.js lines 9-15
   */
  it('should export showNavButton function', () => {
    assert.strictEqual(typeof navActions.showNavButton, 'function');
    console.log('✓ showNavButton function exists');
  });

  it('should create SHOW_NAV_BUTTONS action', () => {
    const action = navActions.showNavButton();
    assert.strictEqual(action.type, 'SHOW_NAV_BUTTONS');
    assert.ok(action.payload !== undefined);
    console.log('✓ showNavButton creates correct action');
  });

  /**
   * TEST 5-6: Hide Logout Button Tests
   * -----------------------------------
   * Same pattern for hideLogoutButton()
   * 
   * SOURCE REFERENCE: navAction.js lines 17-23
   */
  it('should export hideLogoutButton function', () => {
    assert.strictEqual(typeof navActions.hideLogoutButton, 'function');
    console.log('✓ hideLogoutButton function exists');
  });

  it('should create HIDE_LOGOUT_BUTTONS action', () => {
    const action = navActions.hideLogoutButton();
    assert.strictEqual(action.type, 'HIDE_LOGOUT_BUTTONS');
    assert.ok(action.payload !== undefined);
    console.log('✓ hideLogoutButton creates correct action');
  });

  /**
   * TEST 7-8: Show Logout Button Tests
   * -----------------------------------
   * Same pattern for showLogoutButton()
   * 
   * SOURCE REFERENCE: navAction.js lines 25-31
   */
  it('should export showLogoutButton function', () => {
    assert.strictEqual(typeof navActions.showLogoutButton, 'function');
    console.log('✓ showLogoutButton function exists');
  });

  it('should create SHOW_LOGOUT_BUTTONS action', () => {
    const action = navActions.showLogoutButton();
    assert.strictEqual(action.type, 'SHOW_LOGOUT_BUTTONS');
    assert.ok(action.payload !== undefined);
    console.log('✓ showLogoutButton creates correct action');
  });

  /**
   * TEST 9: Verify All Actions Have Empty Payload Object
   * -----------------------------------------------------
   * PURPOSE: Verify consistency across all navigation action creators
   * 
   * WHY TEST ALL TOGETHER:
   * - Ensures uniform behavior across related functions
   * - Catches if someone accidentally adds payload data
   * - Documents that these are "simple" actions (no data)
   * 
   * DESIGN CHOICE:
   * payload: {} could be omitted, but code keeps it for:
   * - Consistency with other actions that DO have payloads
   * - Middleware might expect payload property to exist
   * - Easier to add data later if needed
   * 
   * WHAT WOULD BREAK THIS TEST:
   * - Changing payload: {} to payload: null
   * - Adding data like payload: { timestamp: Date.now() }
   * - Removing payload property entirely
   */
  it('should create actions with empty payload object', () => {
    // Act: Call all four action creators
    const hideNav = navActions.hideNavButton();
    const showNav = navActions.showNavButton();
    const hideLogout = navActions.hideLogoutButton();
    const showLogout = navActions.showLogoutButton();
    
    // Assert: All have identical empty payload
    assert.deepStrictEqual(hideNav.payload, {});
    assert.deepStrictEqual(showNav.payload, {});
    assert.deepStrictEqual(hideLogout.payload, {});
    assert.deepStrictEqual(showLogout.payload, {});
    
    console.log('✓ All actions have empty payload objects');
  });

  /**
   * TEST 10: Verify Action Objects Are Independent
   * -----------------------------------------------
   * PURPOSE: Ensure each call creates a NEW object, not returning a shared one
   * 
   * WHY THIS MATTERS:
   * - If action creators returned the same object reference,
   *   middleware or reducers might accidentally mutate it
   * - Each action should be independent
   * - Redux DevTools needs unique action references for time-travel
   * 
   * HOW THIS TEST WORKS:
   * 1. Call hideNavButton() twice
   * 2. Verify they're not the same object (different references)
   * 3. Verify they have the same content (equivalent values)
   * 
   * ANTI-PATTERN EXAMPLE (would fail this test):
   *   const sharedAction = { type: 'HIDE_NAV_BUTTONS', payload: {} };
   *   export function hideNavButton() {
   *     return sharedAction; // X! Returns same object every time!
   *   }
   * 
   * CORRECT PATTERN (passes this test):
   *   export function hideNavButton() {
   *     return { type: 'HIDE_NAV_BUTTONS', payload: {} }; // ✓ New object each time
   *   }
   */
  it('should create independent action objects', () => {
    // Act: Call same action creator twice
    const action1 = navActions.hideNavButton();
    const action2 = navActions.hideNavButton();
    
    // Assert: Different objects (different memory addresses)
    assert.notStrictEqual(action1, action2); // Not same reference
    
    // Assert: But identical content (same values)
    assert.deepStrictEqual(action1, action2); // Same values
    
    console.log('✓ Each call creates new action object');
  });

});

/**
 * =============================================================================
 * TEST COVERAGE SUMMARY
 * =============================================================================
 * 
 * - All 4 action creator functions exist
 * - All 4 return correct action types
 * - All 4 have correct payload structure
 * - Payload consistency across all actions
 * - Action object independence (no shared references)
 * 
 * COVERAGE: 100% of navAction.js functionality
 * 
 * WHAT'S NOT TESTED:
 * - Integration with Redux store (integration test)
 * - Integration with React components (integration test)
 * - Reducer handling these actions (tested in navReducer.test.js)
 * 
 * TEST APPROACH:
 * This test file imports the REAL source code, so any changes to
 * navAction.js will be immediately caught by these tests.
 * 
 * CONTRAST WITH OTHER ACTION TESTS:
 * Other action files (contactAction, answerAction) use axios and
 * cannot be imported directly. They use contract-based testing instead.
 * This file can test the real functions because they're pure (no dependencies).
 * 
 * RUNNING THIS TEST:
 * node __tests__/unit/navAction.test.js
 * =============================================================================
 */
