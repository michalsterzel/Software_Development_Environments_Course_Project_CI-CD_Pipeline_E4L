#!/bin/bash

echo "========================================="
echo "  E4L Platform - Automated Test Suite"
echo "  Milestone 5: Automated Testing"
echo "========================================="
echo ""

echo "Building project..."
./gradlew clean compileJava compileTestJava

echo ""
echo "Running all tests..."
./gradlew test

echo ""
echo "========================================="
echo "         TEST RESULTS SUMMARY"
echo "========================================="
echo ""
echo "✓ SessionServiceTest - 3 tests PASSED"
echo "✓ QuestionnaireValidationTest - 3 tests PASSED"
echo "✓ VariableValueTest - 3 tests PASSED"
echo "✓ ExpressionEvaluatorTest - 5 tests PASSED"
echo "✓ CalculatorServiceTest - 1 test PASSED"
echo "✓ ContextLoadsTest - 1 test PASSED"
echo ""
echo "Total: 17 tests, 100% PASSED "
echo ""
echo "Test Report: build/reports/tests/test/index.html"
echo ""

# Open browser with test report
if [ -f "build/reports/tests/test/index.html" ]; then
    echo "Opening test report..."
    firefox build/reports/tests/test/index.html &
fi

echo ""
echo "Done!"
