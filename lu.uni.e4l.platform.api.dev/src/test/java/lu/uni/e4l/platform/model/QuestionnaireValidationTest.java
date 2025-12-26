package lu.uni.e4l.platform.model;

import org.junit.Test;
import java.util.ArrayList;
import java.util.List;

import static org.junit.Assert.*;

public class QuestionnaireValidationTest {

    @Test
    public void testQuestionnaireCreation() {
        Questionnaire questionnaire = new Questionnaire();
        List<Question> questions = new ArrayList<>();
        questionnaire.setQuestions(questions);
        
        assertNotNull("Questionnaire should not be null", questionnaire);
        assertNotNull("Questions list should not be null", questionnaire.getQuestions());
    }

    @Test
    public void testQuestionHasName() {
        Question question = new Question();
        question.setName("test_question");
        
        assertEquals("Question name should match", "test_question", question.getName());
    }

    @Test
    public void testPossibleAnswerHasFormula() {
        PossibleAnswer answer = new PossibleAnswer();
        answer.setFormula("2 + 2");
        
        assertEquals("Formula should match", "2 + 2", answer.getFormula());
    }
}
