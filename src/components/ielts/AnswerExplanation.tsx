
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Lightbulb, BookOpen, Target, ArrowRight } from 'lucide-react';

interface AnswerExplanationProps {
  question: any;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  skillType: string;
  questionIndex: number;
}

const AnswerExplanation: React.FC<AnswerExplanationProps> = ({
  question,
  userAnswer,
  correctAnswer,
  isCorrect,
  skillType,
  questionIndex
}) => {
  const getSkillTips = (skill: string, questionType: string) => {
    const tips = {
      listening: {
        multiple_choice: [
          "Listen for keywords and synonyms, not exact matches",
          "Eliminate obviously wrong options first",
          "Pay attention to the speaker's tone and emphasis",
          "Don't choose an answer just because you hear the exact words"
        ],
        fill_blank: [
          "Listen for the specific information that fits grammatically",
          "Pay attention to word forms (singular/plural, verb tenses)",
          "The answer is usually exactly what you hear",
          "Don't change the words you hear unless instructed"
        ]
      },
      reading: {
        true_false: [
          "Look for exact matches, not similar ideas",
          "If information is not mentioned, it's 'Not Given'",
          "Don't use your general knowledge",
          "Pay attention to qualifying words like 'all', 'some', 'never'"
        ],
        multiple_choice: [
          "Read the question carefully to understand what it's asking",
          "Look for paraphrases, not exact word matches",
          "Eliminate options that are clearly wrong",
          "The correct answer may use different words but the same meaning"
        ]
      },
      writing: {
        task1: [
          "Describe the most significant trends and patterns",
          "Use varied vocabulary to describe changes",
          "Compare and contrast data points",
          "Don't give opinions in Task 1, just describe the data"
        ],
        task2: [
          "Address all parts of the question",
          "Give clear examples to support your points",
          "Use linking words to connect ideas",
          "Have a clear position throughout your essay"
        ]
      },
      speaking: {
        part1: [
          "Give extended answers, not just yes/no responses",
          "Use personal examples and experiences",
          "Show range of vocabulary and grammar",
          "Speak naturally and don't memorize answers"
        ],
        part2: [
          "Address all bullet points in the cue card",
          "Use the preparation time effectively",
          "Speak for the full 1-2 minutes",
          "Use descriptive language and specific details"
        ],
        part3: [
          "Give developed, analytical responses",
          "Compare different viewpoints",
          "Use complex grammatical structures",
          "Support opinions with reasons and examples"
        ]
      }
    };

    return tips[skill as keyof typeof tips]?.[questionType as keyof any] || [
      "Practice regularly to improve your skills",
      "Focus on understanding, not just memorizing",
      "Pay attention to keywords and context",
      "Review your mistakes to learn from them"
    ];
  };

  const getDetailedExplanation = () => {
    if (skillType === 'listening') {
      return {
        why: isCorrect 
          ? `You correctly identified the answer because you listened for the key information and recognized the correct response among the options.`
          : `The correct answer is "${correctAnswer}" because this was specifically mentioned in the audio. You may have been distracted by other information or chose based on keywords without considering the full context.`,
        how: isCorrect
          ? "You demonstrated good listening skills by focusing on the relevant part of the conversation and selecting the appropriate answer."
          : `To improve: Listen for the specific information that answers the question. In this case, the speaker clearly stated "${correctAnswer}". Practice identifying key information while ignoring distractors.`,
        lesson: `For ${question.type} questions in IELTS Listening, always focus on understanding the meaning rather than individual words. The correct answer will match the intended meaning even if different words are used.`
      };
    }

    if (skillType === 'reading') {
      return {
        why: isCorrect
          ? `You correctly answered because you found the relevant information in the text and understood its meaning in context.`
          : `The correct answer is "${correctAnswer}" because the passage clearly states or implies this information. You may have misunderstood the text or looked in the wrong section.`,
        how: isCorrect
          ? "You showed good reading comprehension by locating the correct information and understanding its relationship to the question."
          : `To improve: Scan the text for keywords related to the question, then read that section carefully. The answer to this question can be found by looking for information about the topic mentioned in the question.`,
        lesson: `For IELTS Reading questions, always return to the text to verify your answer. Don't rely on memory or general knowledge - the answer must be supported by the passage.`
      };
    }

    return {
      why: isCorrect ? "Good job! You provided an appropriate response." : "Your response could be improved with more specific details or better structure.",
      how: isCorrect ? "Continue practicing to maintain this level." : "Focus on addressing all parts of the question and providing specific examples.",
      lesson: "Regular practice and feedback will help you improve your performance in this skill area."
    };
  };

  const explanation = getDetailedExplanation();
  const tips = getSkillTips(skillType, question.type || 'general');

  return (
    <div className="space-y-6">
      {/* Answer Status */}
      <Card className={`border-l-4 ${isCorrect ? 'border-l-green-500 bg-green-50' : 'border-l-red-500 bg-red-50'}`}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {isCorrect ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-green-800">Correct Answer!</span>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-red-600" />
                <span className="text-red-800">Incorrect Answer</span>
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-700">Your Answer:</p>
              <p className={`text-sm p-2 rounded ${isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {userAnswer || 'No answer provided'}
              </p>
            </div>
            {!isCorrect && (
              <div>
                <p className="text-sm font-medium text-gray-700">Correct Answer:</p>
                <p className="text-sm p-2 rounded bg-green-100 text-green-800">
                  {correctAnswer}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Why This Answer */}
      <Card className="border border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-blue-800">
            <Target className="h-5 w-5" />
            <span>Why This Answer?</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 leading-relaxed">{explanation.why}</p>
        </CardContent>
      </Card>

      {/* How to Improve */}
      <Card className="border border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-purple-800">
            <ArrowRight className="h-5 w-5" />
            <span>How to Get It Right</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 leading-relaxed mb-4">{explanation.how}</p>
          
          {/* Skill-specific Tips */}
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="font-medium text-purple-800 mb-2">Key Strategies:</h4>
            <ul className="space-y-1">
              {tips.map((tip, index) => (
                <li key={index} className="flex items-start space-x-2 text-sm text-purple-700">
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Learning Lesson */}
      <Card className="border border-yellow-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-yellow-800">
            <Lightbulb className="h-5 w-5" />
            <span>Key Learning Point</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-gray-700 leading-relaxed">{explanation.lesson}</p>
          </div>
        </CardContent>
      </Card>

      {/* Practice Recommendation */}
      <Card className="border border-indigo-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-indigo-800">
            <BookOpen className="h-5 w-5" />
            <span>Recommended Practice</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Badge className="bg-indigo-100 text-indigo-800">
              Practice Focus: {question.type || 'General Skills'}
            </Badge>
            <div className="bg-indigo-50 p-4 rounded-lg">
              <p className="text-sm text-indigo-700 mb-2 font-medium">Next Steps:</p>
              <ul className="text-sm text-indigo-600 space-y-1">
                <li>• Take more practice tests focusing on this question type</li>
                <li>• Review similar questions and their explanations</li>
                <li>• Practice the specific strategies mentioned above</li>
                <li>• Time yourself to improve speed and accuracy</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnswerExplanation;
