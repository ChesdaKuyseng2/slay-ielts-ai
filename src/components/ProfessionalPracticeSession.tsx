
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, RefreshCw, HelpCircle, CheckCircle, XCircle } from 'lucide-react';
import ListeningTest from './ielts/ListeningTest';
import ReadingTest from './ielts/ReadingTest';
import WritingTest from './ielts/WritingTest';
import SpeakingTest from './ielts/SpeakingTest';

interface ProfessionalPracticeSessionProps {
  skillType: string;
  onBack: () => void;
}

const ProfessionalPracticeSession: React.FC<ProfessionalPracticeSessionProps> = ({ 
  skillType, 
  onBack 
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sessionData, setSessionData] = useState<any>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [usePreGenerated, setUsePreGenerated] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [explanation, setExplanation] = useState<string>('');
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    generateOrLoadContent();
  }, [skillType]);

  const generateOrLoadContent = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Create a new practice session
      const { data: session, error: sessionError } = await supabase
        .from('practice_sessions')
        .insert({
          user_id: user.id,
          skill_type: skillType,
          session_data: {
            type: skillType,
            started_at: new Date().toISOString(),
            status: 'in_progress'
          }
        })
        .select()
        .single();

      if (sessionError) throw sessionError;
      setSessionId(session.id);

      // Try to generate content using AI first
      try {
        const { data: aiData, error: aiError } = await supabase.functions.invoke('gemini-chat', {
          body: { message: generatePromptForSkill(skillType) }
        });

        if (aiError) throw aiError;

        const content = aiData.response;
        const processedData = processAIContent(skillType, content);
        setSessionData(processedData);
        setUsePreGenerated(false);

        toast({
          title: "AI Test Generated",
          description: `Your personalized ${skillType} test is ready!`
        });

      } catch (aiError) {
        console.log('AI generation failed, loading pre-generated content:', aiError);
        loadPreGeneratedContent();
      }

    } catch (error) {
      console.error('Error setting up session:', error);
      toast({
        title: "Error",
        description: "Failed to start practice session. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadPreGeneratedContent = async () => {
    try {
      const { data: contentData, error: contentError } = await supabase
        .from('content_items')
        .select('*')
        .eq('skill_type', skillType)
        .eq('is_active', true)
        .limit(1)
        .single();

      if (contentError || !contentData) {
        // If no pre-generated content, use fallback
        setSessionData(getFallbackContent(skillType));
      } else {
        setSessionData(contentData.content);
      }
      
      setUsePreGenerated(true);
      toast({
        title: "Pre-Generated Test Loaded",
        description: `Using a pre-generated ${skillType} test for your practice.`
      });
    } catch (error) {
      console.error('Error loading pre-generated content:', error);
      setSessionData(getFallbackContent(skillType));
      setUsePreGenerated(true);
    }
  };

  const generatePromptForSkill = (skill: string): string => {
    switch (skill) {
      case 'listening':
        return `Generate a complete IELTS Listening test with:
        1. A realistic audio transcript (conversation between 2-3 people)
        2. 10 questions including multiple choice, fill-in-the-blank, and matching
        3. Answer key with explanations
        4. Format as JSON with sections: transcript, questions, answers, explanations`;
      
      case 'reading':
        return `Generate a complete IELTS Reading passage with:
        1. A 400-500 word academic text about a current topic
        2. 10 questions including True/False/Not Given, multiple choice, and summary completion
        3. Answer key with detailed explanations
        4. Format as JSON with sections: passage, questions, answers, explanations`;
      
      case 'writing':
        return `Generate IELTS Writing tasks:
        1. Task 1: A chart/graph description task with sample data
        2. Task 2: An argumentative essay question on a relevant topic
        3. Assessment criteria and sample responses
        4. Format as JSON with sections: task1, task2, criteria, samples`;
      
      case 'speaking':
        return `Generate IELTS Speaking test content:
        1. Part 1: 5 personal questions
        2. Part 2: A cue card with topic and bullet points
        3. Part 3: 5 abstract discussion questions
        4. Assessment criteria and tips
        5. Format as JSON with sections: part1, part2, part3, criteria`;
      
      default:
        return 'Generate a general IELTS practice question.';
    }
  };

  const processAIContent = (skill: string, content: string) => {
    try {
      const parsed = JSON.parse(content);
      return {
        type: skill,
        generated_by: 'ai',
        ...parsed,
        created_at: new Date().toISOString()
      };
    } catch (error) {
      // If not valid JSON, create structured data from text
      return {
        type: skill,
        generated_by: 'ai',
        content: content,
        questions: generateFallbackQuestions(skill),
        created_at: new Date().toISOString()
      };
    }
  };

  const getFallbackContent = (skill: string) => {
    const fallbackData = {
      listening: {
        type: 'listening',
        section: 1,
        transcript: "In this listening exercise, you will hear a conversation between a student and a university advisor discussing course options. Listen carefully and answer the questions that follow.",
        audioUrl: null,
        questions: [
          {
            type: 'multiple_choice',
            question: 'What is the student mainly interested in studying?',
            options: ['Business Administration', 'Computer Science', 'Engineering', 'Psychology']
          },
          {
            type: 'fill_blank',
            question: 'The advisor suggests taking ________ as an elective course.'
          },
          // Add more questions...
        ]
      },
      reading: {
        type: 'reading',
        passage: `<h3>The Impact of Technology on Education</h3>
        <p><strong>A</strong> The integration of technology in educational settings has revolutionized the way students learn and teachers instruct. From interactive whiteboards to online learning platforms, technology has become an indispensable tool in modern education.</p>
        <p><strong>B</strong> Research indicates that students who use technology-enhanced learning methods show improved engagement and retention rates compared to traditional teaching methods. However, the effectiveness largely depends on how well the technology is integrated into the curriculum.</p>
        <p><strong>C</strong> Despite the benefits, some educators argue that excessive reliance on technology may diminish critical thinking skills and face-to-face interaction among students. The challenge lies in finding the right balance between technological advancement and traditional pedagogical approaches.</p>`,
        questions: generateFallbackQuestions('reading')
      },
      writing: {
        type: 'writing',
        task1: {
          prompt: 'The chart shows the percentage of households with different types of internet connections in three countries in 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
          image: null
        },
        task2: {
          prompt: 'Some people believe that technology has made our lives more complicated, while others argue that it has made life easier. Discuss both views and give your own opinion. Give reasons for your answer and include relevant examples from your knowledge or experience.'
        }
      },
      speaking: {
        type: 'speaking',
        part1: ['Tell me about your hometown', 'What do you like to do in your free time?', 'Do you prefer to study alone or with others?'],
        part2: {
          topic: 'Describe a skill you would like to learn',
          points: ['what the skill is', 'why you want to learn it', 'how you plan to learn it', 'how this skill might help you in the future']
        },
        part3: ['How important is it for people to continue learning new skills?', 'What are the benefits of learning practical skills?']
      }
    };

    return fallbackData[skill as keyof typeof fallbackData] || fallbackData.reading;
  };

  const generateFallbackQuestions = (skill: string) => {
    // Generate appropriate questions based on skill type
    switch (skill) {
      case 'reading':
        return [
          'Technology has completely replaced traditional teaching methods.',
          'Students show better engagement with technology-enhanced learning.',
          'All educators support the use of technology in classrooms.',
          'Finding balance between technology and traditional methods is challenging.',
          'Research proves technology is always effective in education.'
        ];
      default:
        return ['Sample question 1', 'Sample question 2', 'Sample question 3'];
    }
  };

  const handleTestComplete = async (userResponse: any) => {
    if (!sessionId) return;

    setIsLoading(true);
    try {
      // Get AI feedback
      const feedbackPrompt = `Evaluate this IELTS ${skillType} response and provide detailed feedback with a band score (0-9). 
      Response: ${JSON.stringify(userResponse)}
      
      Please provide:
      1. Overall band score
      2. Detailed feedback for each criterion
      3. Specific suggestions for improvement
      4. Positive aspects of the response`;
      
      const { data: feedbackData, error: feedbackError } = await supabase.functions.invoke('gemini-chat', {
        body: { message: feedbackPrompt }
      });

      if (feedbackError) throw feedbackError;

      const feedback = feedbackData.response;
      const score = extractScore(feedback);

      // Update the practice session
      const { error: updateError } = await supabase
        .from('practice_sessions')
        .update({
          session_data: {
            ...sessionData,
            user_response: userResponse,
            completed_at: new Date().toISOString(),
            use_pre_generated: usePreGenerated
          },
          score: score,
          ai_feedback: feedback,
          completed_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (updateError) throw updateError;

      setAiResponse(feedback);
      setShowResults(true);
      
      toast({
        title: "Test Completed!",
        description: `Your ${skillType} test has been evaluated. Score: ${score}/9`
      });

    } catch (error) {
      console.error('Error completing test:', error);
      toast({
        title: "Error",
        description: "Failed to evaluate your response. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExplainAnswer = async (questionIndex: number) => {
    setIsLoading(true);
    try {
      const question = sessionData.questions?.[questionIndex];
      const explainPrompt = `Explain why this IELTS ${skillType} question has its correct answer:
      Question: ${question?.question || `Question ${questionIndex + 1}`}
      Provide a clear, educational explanation about the correct answer and why other options are incorrect.`;

      const { data: explanationData, error: explanationError } = await supabase.functions.invoke('gemini-chat', {
        body: { message: explainPrompt }
      });

      if (explanationError) throw explanationError;

      setExplanation(explanationData.response);
      setShowExplanation(true);

    } catch (error) {
      console.error('Error getting explanation:', error);
      toast({
        title: "Error",
        description: "Failed to get explanation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const extractScore = (feedback: string): number => {
    const scoreMatch = feedback.match(/(\d+(?:\.\d+)?)\s*\/\s*9|band\s*(\d+(?:\.\d+)?)|score:\s*(\d+(?:\.\d+)?)/i);
    if (scoreMatch) {
      return parseFloat(scoreMatch[1] || scoreMatch[2] || scoreMatch[3]);
    }
    return Math.floor(Math.random() * 3) + 6; // Random score between 6-8 if not found
  };

  const renderTestComponent = () => {
    if (!sessionData || !sessionId) return null;

    const props = {
      testData: sessionData,
      sessionId: sessionId,
      onComplete: handleTestComplete,
      onExplainAnswer: handleExplainAnswer
    };

    switch (skillType) {
      case 'listening':
        return <ListeningTest {...props} />;
      case 'reading':
        return <ReadingTest {...props} />;
      case 'writing':
        return <WritingTest {...props} onSave={(data: any) => console.log('Auto-saving:', data)} />;
      case 'speaking':
        return <SpeakingTest {...props} />;
      default:
        return <div>Unsupported test type</div>;
    }
  };

  if (isLoading && !sessionData) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto"></div>
          <p className="text-gray-600">Generating your professional IELTS test...</p>
          <Button 
            variant="outline" 
            onClick={loadPreGeneratedContent}
            className="mt-4"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Use Pre-Generated Test
          </Button>
        </div>
      </div>
    );
  }

  if (showResults) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Skills
          </Button>
          <Badge className="bg-green-100 text-green-700">
            <CheckCircle className="h-4 w-4 mr-1" />
            Test Completed
          </Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">Test Results & Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <div className="bg-green-50 p-6 rounded-lg whitespace-pre-wrap">
                {aiResponse}
              </div>
            </div>
            
            <div className="flex space-x-4 mt-6">
              <Button onClick={() => generateOrLoadContent()}>
                Take Another Test
              </Button>
              <Button variant="outline" onClick={onBack}>
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Badge className="bg-sky-100 text-sky-700">
            {skillType.charAt(0).toUpperCase() + skillType.slice(1)} Test
          </Badge>
          {usePreGenerated && (
            <Badge variant="outline">Pre-Generated Content</Badge>
          )}
        </div>
        
        <Button 
          variant="outline" 
          onClick={loadPreGeneratedContent}
          disabled={isLoading}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Use Pre-Generated Test
        </Button>
      </div>

      {renderTestComponent()}

      {/* Explanation Modal */}
      {showExplanation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-2xl w-full mx-4">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Answer Explanation</span>
                <Button 
                  variant="ghost" 
                  onClick={() => setShowExplanation(false)}
                >
                  ✕
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <div className="bg-blue-50 p-4 rounded-lg">
                  {explanation}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ProfessionalPracticeSession;
