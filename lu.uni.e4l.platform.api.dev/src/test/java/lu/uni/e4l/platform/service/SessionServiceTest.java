package lu.uni.e4l.platform.service;

import lu.uni.e4l.platform.model.Session;
import lu.uni.e4l.platform.model.Answer;
import org.junit.Test;
import java.util.ArrayList;
import java.util.List;

import static org.junit.Assert.*;

public class SessionServiceTest {

    @Test
    public void testSessionCreationWithKidFlag() {
        Session session = new Session();
        session.setIskid(true);
        
        assertTrue("Session should be marked as kid", session.getIskid());
    }

    @Test
    public void testSessionCreationWithAdultFlag() {
        Session session = new Session();
        session.setIskid(false);
        
        assertFalse("Session should not be marked as kid", session.getIskid());
    }

    @Test
    public void testSessionWithAnswers() {
        Session session = new Session();
        List<Answer> answers = new ArrayList<>();
        session.setAnswers(answers);
        
        assertNotNull("Session answers should not be null", session.getAnswers());
        assertEquals("Session should have empty answers list", 0, session.getAnswers().size());
    }
}
