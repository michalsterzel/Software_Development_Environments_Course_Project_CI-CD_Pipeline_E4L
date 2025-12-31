package lu.uni.e4l.platform.model;

import org.junit.Test;
import static org.junit.Assert.*;

public class VariableValueTest {

    @Test
    public void testVariableValueCreation() {
        VariableValue variableValue = new VariableValue();
        variableValue.setValue(10.5);
        
        assertEquals("Variable value should be 10.5", 10.5, variableValue.getValue(), 0.001);
    }

    @Test
    public void testVariableWithNegativeValue() {
        VariableValue variableValue = new VariableValue();
        variableValue.setValue(-5.0);
        
        assertTrue("Variable value should be negative", variableValue.getValue() < 0);
    }

    @Test
    public void testVariableWithZeroValue() {
        VariableValue variableValue = new VariableValue();
        variableValue.setValue(0.0);
        
        assertEquals("Variable value should be zero", 0.0, variableValue.getValue(), 0.001);
    }
}
