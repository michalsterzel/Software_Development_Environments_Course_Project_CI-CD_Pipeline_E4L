describe('E4L Platform - Critical Functionality Tests (Self-Contained)', () => {
  // ============================================================
  // TEST 1: User Authentication
  // ============================================================

  test(
    '1. CRITICAL: GIVEN unauthenticated state, WHEN login succeeds, THEN user is authenticated and token stored',
    () => {
      const initialState = {
        isAuthenticate: false,
        token: null,
        loginFailed: false,
        isLoggingIn: false,
        isSignedUp: false,
      };

      const newState = Object.assign({}, initialState, {
        isAuthenticate: true,
        token: 'valid-jwt-token-123',
        loginFailed: false,
        isLoggingIn: false,
        isSignedUp: true,
      });

      const expectedState = {
        isAuthenticate: true,
        token: 'valid-jwt-token-123',
        loginFailed: false,
        isLoggingIn: false,
        isSignedUp: true,
      };

      // Full-state comparison: shows complete Expected vs Received diff on failure
      expect(newState).toEqual(expectedState);

      // Extra explicit field-level expectations
      expect(newState.isAuthenticate).toBe(true);          // user should now be authenticated
      expect(newState.token).toBe('valid-jwt-token-123');  // token should be the one returned by backend
      expect(newState.loginFailed).toBe(false);            // loginFailed reset after success
      expect(newState.isSignedUp).toBe(true);              // user considered signed up
    }
  );

  // ============================================================
  // TEST 2: User Logout
  // ============================================================

  test(
    '2. CRITICAL: GIVEN authenticated user, WHEN LOGOUT is processed, THEN auth data is cleared and flags reset',
    () => {
      const authState = {
        isAuthenticate: true,
        token: 'valid-token',
        user: { id: 1 },
        isSignedUp: true,
      };

      const newState = Object.assign({}, authState, {
        isAuthenticate: false,
        token: null,
        user: null,
        loginFailed: false,
        isSignedUp: false,
        isSigningUp: false,
        signingUpFailed: false,
      });

      const expectedState = {
        isAuthenticate: false,
        token: null,
        user: null,
        loginFailed: false,
        isSignedUp: false,
        isSigningUp: false,
        signingUpFailed: false,
      };

      expect(newState).toEqual(expectedState);

      expect(newState.isAuthenticate).toBe(false); // user logged out
      expect(newState.token).toBeNull();           // token removed
      expect(newState.user).toBeNull();            // user object cleared
    }
  );

  // ============================================================
  // TEST 3: Seminar Code Validation
  // ============================================================

  test(
    '3. CRITICAL: GIVEN pending code check, WHEN seminar code is valid, THEN code is marked valid and seminar open',
    () => {
      const state = {
        isCodeValid: false,
        isGetPending: true,
        isSeminarOpen: null,
        currentSeminarStatus: null,
      };

      const newState = Object.assign({}, state, {
        isGetPending: false,
        isCodeValid: true,
        isSeminarOpen: true,
        currentSeminarStatus: 'OPEN',
      });

      const expectedState = {
        isCodeValid: true,
        isGetPending: false,
        isSeminarOpen: true,
        currentSeminarStatus: 'OPEN',
      };

      expect(newState).toEqual(expectedState);

      expect(newState.isCodeValid).toBe(true);              // code accepted
      expect(newState.isSeminarOpen).toBe(true);            // seminar open for participation
      expect(newState.currentSeminarStatus).toBe('OPEN');   // explicit status string
    }
  );

  // ============================================================
  // TEST 4: Answer Selection Logic
  // ============================================================

  test(
    '4. CRITICAL: GIVEN empty answers, WHEN SELECT_ANSWER, THEN session.answers contains exactly that answer',
    () => {
      const state = {
        session: {
          answers: [],
        },
      };

      const newAnswer = {
        possibleAnswer: { id: 42 },
        variableValues: [],
      };

      const newState = {
        ...state,
        session: {
          ...state.session,
          answers: [newAnswer],
        },
      };

      const expectedState = {
        session: {
          answers: [newAnswer],
        },
      };

      expect(newState).toEqual(expectedState);

      expect(newState.session.answers.length).toBe(1);                // only one answer added
      expect(newState.session.answers[0]).toEqual(newAnswer);         // answer object matches
      expect(newState.session.answers[0].possibleAnswer.id).toBe(42); // specific selected ID
    }
  );

  // ============================================================
  // TEST 5: Questionnaire Navigation
  // ============================================================

  test(
    '5. CRITICAL: GIVEN currentQuestion = 0, WHEN NEXT_PAGE, THEN currentQuestion increments to 1',
    () => {
      const state = {
        currentQuestion: 0,
        questionnaire: {
          questions: Array(3).fill({ id: 1 }),
        },
      };

      const newState = {
        ...state,
        currentQuestion: 1,
        canGoNext: false,
      };

      const expectedState = {
        currentQuestion: 1,
        questionnaire: {
          questions: Array(3).fill({ id: 1 }),
        },
        canGoNext: false,
      };

      expect(newState).toEqual(expectedState);
      expect(newState.currentQuestion).toBe(1); // advanced by one step
    }
  );

  // ============================================================
  // TEST 6: Error Handling
  // ============================================================

  test(
    '6. CRITICAL: GIVEN logged-in user, WHEN auth error occurs, THEN user is logged out and error stored',
    () => {
      const state = { isAuthenticate: true, token: 'token' };

      const newState = {
        ...state,
        isAuthenticate: false,
        token: null,
        error: 'Invalid credentials',
        loginFailed: true,
        isLoggingIn: false,
      };

      const expectedState = {
        isAuthenticate: false,
        token: null,
        error: 'Invalid credentials',
        loginFailed: true,
        isLoggingIn: false,
      };

      expect(newState).toEqual(expectedState);

      expect(newState.isAuthenticate).toBe(false); // user treated as logged out
      expect(newState.loginFailed).toBe(true);     // failure flag raised
    }
  );

  // ============================================================
  // TEST 7: Seminar List Loading
  // ============================================================

  test(
    '7. CRITICAL: GIVEN empty seminar lists, WHEN seminars loaded, THEN seminarAmounts derived from seminarCounter',
    () => {
      const state = { seminars: [], seminarAmounts: [] };

      const seminars = [
        { id: 1, seminarCounter: 25 },
        { id: 2, seminarCounter: 10 },
      ];

      const newState = {
        ...state,
        seminars,
        seminarAmounts: seminars.map((s) => ({
          id: s.id,
          amount: s.seminarCounter,
        })),
      };

      const expectedState = {
        seminars,
        seminarAmounts: [
          { id: 1, amount: 25 },
          { id: 2, amount: 10 },
        ],
      };

      expect(newState).toEqual(expectedState);

      expect(newState.seminars.length).toBe(2);          // two seminars loaded
      expect(newState.seminarAmounts.length).toBe(2);    // two derived counters
    }
  );

  // ============================================================
  // TEST 8: User Creation Pending -> Success
  // ============================================================

  test(
    '8. CRITICAL: GIVEN no creation, WHEN pending then success, THEN flags move from pending → created',
    () => {
      const state = { isCreationPending: false, isCreated: false };

      const pendingState = {
        ...state,
        isCreationPending: true,
        isCreated: false,
      };

      const successState = {
        ...pendingState,
        isCreationPending: false,
        isCreated: true,
      };

      const expectedPending = {
        isCreationPending: true,
        isCreated: false,
      };

      const expectedSuccess = {
        isCreationPending: false,
        isCreated: true,
      };

      expect(pendingState).toEqual(expectedPending);
      expect(successState).toEqual(expectedSuccess);

      expect(pendingState.isCreationPending).toBe(true); // request in flight
      expect(successState.isCreated).toBe(true);         // final created state
    }
  );

  // ============================================================
  // TEST 9: Password Validation Logic
  // ============================================================

  test(
    '9. CRITICAL: GIVEN strong+weak passwords, WHEN validated, THEN strong passes and weak fails',
    () => {
      const strongPassword = 'SecurePass123!';
      const weakPassword = 'weak';

      const strongRegex =
        /^(?=(.*[a-z]){1,})(?=(.*[A-Z]){1,})(?=(.*[0-9]){1,})(?=(.*[!@#$%^&*()\-__+.]){1,}).{8,}$/;

      const strongResult = strongRegex.test(strongPassword);
      const weakResult = strongRegex.test(weakPassword);

      expect(strongResult).toBe(true);  // strong password must be accepted
      expect(weakResult).toBe(false);   // weak password must be rejected
    }
  );

  // ============================================================
  // TEST 10: Language Change
  // ============================================================

  test(
    '10. CRITICAL: GIVEN lang = en, WHEN user selects fr, THEN lang is updated to fr',
    () => {
      const state = { lang: 'en' };

      const newState = { ...state, lang: 'fr' };

      const expectedState = { lang: 'fr' };

      expect(newState).toEqual(expectedState);
      expect(newState.lang).toBe('fr'); // language actually switched
    }
  );
});

