import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Brain, Clock, Trophy, BookOpen, Headphones, PenTool, Mic, CheckCircle, Star, TrendingUp, RefreshCw, Database, Shuffle } from 'lucide-react';
import ListeningTest from './ListeningTest';
import ReadingTest from './ReadingTest';  
import WritingTest from './WritingTest';
import SpeakingTest from './SpeakingTest';
import { AIFeedback } from '@/types/database';

interface AITestSessionProps {
  skillType: string;
  onBack: () => void;
}

interface TestContent {
  id: string;
  content: any;
  topic: string;
  isPreGenerated?: boolean;
}

const AITestSession: React.FC<AITestSessionProps> = ({ skillType, onBack }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [testContent, setTestContent] = useState<TestContent | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showTest, setShowTest] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<AIFeedback | null>(null);
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
  const [testStartTime, setTestStartTime] = useState<Date | null>(null);
  const [availableTests, setAvailableTests] = useState<any[]>([]);
  const [currentTestIndex, setCurrentTestIndex] = useState(0);

  const skillIcons = {
    listening: <Headphones className="h-6 w-6" />,
    reading: <BookOpen className="h-6 w-6" />,
    writing: <PenTool className="h-6 w-6" />,
    speaking: <Mic className="h-6 w-6" />
  };

  const skillColors = {
    listening: 'from-blue-500 to-blue-600',
    reading: 'from-green-500 to-green-600', 
    writing: 'from-purple-500 to-purple-600',
    speaking: 'from-orange-500 to-orange-600'
  };

  // Get integer band score (rounds to nearest 0.5)
  const getDisplayScore = (score: number): number => {
    return Math.round(score * 2) / 2;
  };

  // Get color based on band score
  const getScoreColor = (score: number): string => {
    const displayScore = getDisplayScore(score);
    if (displayScore >= 8.5) return 'text-green-600';
    if (displayScore >= 7.0) return 'text-blue-600';
    if (displayScore >= 6.0) return 'text-yellow-600';
    if (displayScore >= 5.0) return 'text-orange-600';
    return 'text-red-600';
  };

  // Get progress bar color
  const getProgressColor = (score: number): string => {
    const displayScore = getDisplayScore(score);
    if (displayScore >= 8.5) return 'from-green-500 to-green-600';
    if (displayScore >= 7.0) return 'from-blue-500 to-blue-600';
    if (displayScore >= 6.0) return 'from-yellow-500 to-yellow-600';
    if (displayScore >= 5.0) return 'from-orange-500 to-orange-600';
    return 'from-red-500 to-red-600';
  };

  useEffect(() => {
    if (user) {
      loadAvailableTests();
    }
  }, [skillType, user]);

  const loadAvailableTests = async () => {
    try {
      console.log(`Loading available ${skillType} tests from database`);
      
      const { data: preGeneratedTests, error } = await supabase
        .from('ai_generated_tests')
        .select('*')
        .eq('skill_type', skillType)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading tests:', error);
        setAvailableTests([]);
        return;
      }

      if (preGeneratedTests && preGeneratedTests.length > 0) {
        console.log(`Found ${preGeneratedTests.length} pre-generated tests`);
        setAvailableTests(preGeneratedTests);
        // Set the first test as current
        const firstTest = preGeneratedTests[0];
        setTestContent({
          id: firstTest.id,
          content: firstTest.content,
          topic: firstTest.topic || `${skillType} test`,
          isPreGenerated: true
        });
      } else {
        console.log('No pre-generated tests found, will generate new one');
        setAvailableTests([]);
      }
    } catch (error) {
      console.error('Error in loadAvailableTests:', error);
      setAvailableTests([]);
    }
  };

  const selectRandomTest = async () => {
    if (availableTests.length === 0) {
      toast({
        title: "No Tests Available",
        description: "Generating a new AI test for you...",
      });
      await generateFreshAITest();
      return;
    }

    // Select a random test from available tests
    const randomIndex = Math.floor(Math.random() * availableTests.length);
    const selectedTest = availableTests[randomIndex];
    
    setCurrentTestIndex(randomIndex);
    setTestContent({
      id: selectedTest.id,
      content: selectedTest.content,
      topic: selectedTest.topic || `${skillType} test`,
      isPreGenerated: true
    });

    toast({
      title: "Test Selected",
      description: `Selected test: ${selectedTest.topic || 'Random test'}`,
    });
  };

  const loadNextTest = async () => {
    if (availableTests.length === 0) {
      await generateFreshAITest();
      return;
    }

    // Get next test in rotation
    const nextIndex = (currentTestIndex + 1) % availableTests.length;
    const nextTest = availableTests[nextIndex];
    
    setCurrentTestIndex(nextIndex);
    setTestContent({
      id: nextTest.id,
      content: nextTest.content,
      topic: nextTest.topic || `${skillType} test`,
      isPreGenerated: true
    });

    toast({
      title: "Next Test Loaded",
      description: `Test: ${nextTest.topic || 'Practice test'}`,
    });
  };

  const generateFreshAITest = async () => {
    setIsLoading(true);
    try {
      console.log(`Generating fresh AI test for ${skillType}`);
      
      const response = await supabase.functions.invoke('gemini-chat', {
        body: {
          message: `Generate a comprehensive IELTS ${skillType} test with detailed questions and realistic content. Format the response as valid JSON.`,
          skill: skillType,
          generateContent: true
        }
      });

      if (response.error) {
        throw response.error;
      }

      let testData;
      let topic = `AI Generated ${skillType} Test`;
      
      if (response.data && response.data.response) {
        try {
          testData = JSON.parse(response.data.response);
          topic = response.data.topic || topic;
        } catch (parseError) {
          console.warn('Failed to parse AI response, using fallback');
          testData = createFallbackTest(skillType).content;
        }
      } else {
        testData = createFallbackTest(skillType).content;
      }

      // Store the new test in database
      const { data: storedTest, error: storeError } = await supabase
        .from('ai_generated_tests')
        .insert({
          skill_type: skillType,
          content: testData,
          topic: topic,
          difficulty_level: 'intermediate'
        })
        .select()
        .single();

      if (!storeError && storedTest) {
        setTestContent({
          id: storedTest.id,
          content: testData,
          topic: storedTest.topic || topic,
          isPreGenerated: false
        });
        
        // Add to available tests
        setAvailableTests(prev => [storedTest, ...prev]);
      } else {
        console.warn('Failed to store test, using local content');
        const fallbackTest = createFallbackTest(skillType);
        setTestContent({
          id: fallbackTest.id,
          content: fallbackTest.content,
          topic: fallbackTest.topic,
          isPreGenerated: false
        });
      }

      toast({
        title: "New Test Generated",
        description: `Fresh ${skillType} test created successfully!`
      });

    } catch (error) {
      console.error('Error generating AI test:', error);
      const fallbackTest = createFallbackTest(skillType);
      setTestContent({
        id: fallbackTest.id,
        content: fallbackTest.content,
        topic: fallbackTest.topic,
        isPreGenerated: false
      });
      
      toast({
        title: "Test Ready",
        description: `${skillType} test ready (using backup content)`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createFallbackTest = (skill: string) => {
    const fallbackTests = {
      listening: {
        skill_type: skill,
        content: {
          title: "University Library Services",
          transcript: "Welcome to the university library orientation. My name is Sarah, and I'll be showing you around today. The library is open from 8 AM to 10 PM Monday through Friday, and 9 AM to 6 PM on weekends. We have five floors in total. The ground floor contains the reception desk, computer terminals, and the café. The first floor has our fiction and general reading collection. The second floor is dedicated to academic texts and reference materials. The third floor houses our special collections and archives. The fourth floor is our quiet study area with individual study booths. To borrow books, you'll need your student ID card. Undergraduate students can borrow up to 10 books for 3 weeks, while graduate students can borrow up to 15 books for 6 weeks. There's a fine of 50 cents per day for overdue books. We also offer printing services at 10 cents per page for black and white, and 25 cents for color printing. The library provides free Wi-Fi throughout the building. If you need help finding resources, our librarians are available at the help desk on the ground floor from 9 AM to 5 PM daily.",
          questions: [
            {
              id: 1,
              type: "multiple_choice",
              question: "What are the library's opening hours on weekdays?",
              options: ["8 AM to 10 PM", "9 AM to 6 PM", "9 AM to 10 PM", "8 AM to 6 PM"],
              correctAnswer: "8 AM to 10 PM"
            },
            {
              id: 2,
              type: "fill_blank",
              question: "The café is located on the ________ floor.",
              correctAnswer: "ground"
            },
            {
              id: 3,
              type: "multiple_choice",
              question: "How many books can graduate students borrow?",
              options: ["10 books", "15 books", "20 books", "12 books"],
              correctAnswer: "15 books"
            },
            {
              id: 4,
              type: "fill_blank",
              question: "The fine for overdue books is ________ cents per day.",
              correctAnswer: "50"
            },
            {
              id: 5,
              type: "multiple_choice",
              question: "Where is the quiet study area located?",
              options: ["Ground floor", "First floor", "Third floor", "Fourth floor"],
              correctAnswer: "Fourth floor"
            }
          ]
        },
        topic: "University Library Services",
        id: 'fallback-listening'
      },
      reading: {
        skill_type: skill,
        content: {
          title: "The Impact of Artificial Intelligence on Modern Healthcare",
          passage: "Artificial Intelligence (AI) is revolutionizing healthcare in unprecedented ways, transforming how medical professionals diagnose, treat, and prevent diseases. The integration of AI technologies in healthcare systems worldwide has shown remarkable potential to improve patient outcomes while reducing costs and increasing efficiency.\n\nOne of the most significant applications of AI in healthcare is in medical imaging and diagnostics. Machine learning algorithms can now analyze medical images such as X-rays, MRIs, and CT scans with accuracy that often surpasses human radiologists. For instance, AI systems have demonstrated the ability to detect early-stage cancers in mammograms and identify diabetic retinopathy in eye scans with remarkable precision. This capability not only speeds up the diagnostic process but also helps catch diseases in their early stages when treatment is most effective.\n\nAI is also making substantial contributions to drug discovery and development. Traditional pharmaceutical research can take decades and cost billions of dollars to bring a new drug to market. AI algorithms can analyze vast databases of molecular information to identify potential drug compounds, predict their effectiveness, and anticipate possible side effects. This process significantly reduces the time and cost associated with drug development, potentially bringing life-saving medications to patients faster than ever before.\n\nPersonalized medicine represents another frontier where AI is making significant strides. By analyzing individual patient data, including genetic information, medical history, and lifestyle factors, AI systems can help doctors create tailored treatment plans that are more likely to be effective for specific patients. This approach moves away from the traditional 'one-size-fits-all' model of medicine toward more precise, individualized care.\n\nHowever, the implementation of AI in healthcare is not without challenges. Privacy and security concerns are paramount, as AI systems require access to vast amounts of sensitive patient data. Ensuring this information remains protected while still allowing AI systems to function effectively requires robust cybersecurity measures and strict regulatory compliance. Additionally, there are concerns about the potential for AI to replace human healthcare workers, though most experts believe AI will augment rather than replace human expertise in medicine.",
          questions: [
            {
              id: 1,
              type: "true_false_not_given",
              question: "AI systems can analyze medical images more accurately than human radiologists in all cases.",
              correctAnswer: "Not Given"
            },
            {
              id: 2,
              type: "multiple_choice",
              question: "According to the passage, AI in drug discovery helps to:",
              options: [
                "Eliminate all side effects of new drugs",
                "Reduce time and cost of drug development", 
                "Replace traditional pharmaceutical research entirely",
                "Guarantee success of new medications"
              ],
              correctAnswer: "Reduce time and cost of drug development"
            },
            {
              id: 3,
              type: "true_false_not_given",
              question: "Personalized medicine using AI considers only genetic information.",
              correctAnswer: "False"
            },
            {
              id: 4,
              type: "summary_completion",
              question: "The main challenge in implementing AI in healthcare is ensuring ________ and security of patient data.",
              correctAnswer: "privacy"
            },
            {
              id: 5,
              type: "true_false_not_given",
              question: "Most experts believe AI will completely replace human healthcare workers.",
              correctAnswer: "False"
            }
          ]
        },
        topic: "AI in Healthcare",
        id: 'fallback-reading'
      },
      writing: {
        skill_type: skill,
        content: {
          title: "IELTS Writing Test",
          task1: {
            prompt: "The chart below shows the percentage of households in owned and rented accommodation in England and Wales between 1918 and 2011. Summarize the information by selecting and reporting the main features, and make comparisons where relevant.",
            type: "data_description",
            wordCount: 150
          },
          task2: {
            prompt: "Some people think that all university students should study whatever they like. Others believe that they should only be allowed to study subjects that will be useful in the future, such as those related to science and technology. Discuss both these views and give your own opinion.",
            type: "argumentative_essay",
            wordCount: 250
          }
        },
        topic: "Education and Career Choices",
        id: 'fallback-writing'
      },
      speaking: {
        skill_type: skill,
        content: {
          title: "IELTS Speaking Test",
          part1: [
            "Let's talk about your hometown. Where are you from?",
            "What do you like most about your hometown?",
            "How has your hometown changed in recent years?",
            "Would you like to live in your hometown in the future?"
          ],
          part2: {
            topic: "Describe a book you have recently read",
            cue_card: "You should say:\n- What the book was about\n- When you read it\n- Why you chose to read it\n- And explain what you learned from it",
            preparation_time: 60,
            speaking_time: 120
          },
          part3: [
            "How important is reading in your country?",
            "Do you think people read more or less than they did in the past?",
            "What are the benefits of reading books compared to watching movies?",
            "How do you think reading habits will change in the future?"
          ]
        },
        topic: "Books and Reading",
        id: 'fallback-speaking'
      }
    };

    return fallbackTests[skill as keyof typeof fallbackTests];
  };

  const insertTestHistory = async (userId: string, sessionId: string, testType: string, skillType: string, testContent: any) => {
    try {
      const { error: rpcError } = await supabase.rpc('insert_test_history', {
        p_user_id: userId,
        p_session_id: sessionId,
        p_test_type: testType,
        p_skill_type: skillType,
        p_test_content: testContent
      });
      
      if (rpcError) {
        console.warn('RPC insert_test_history failed:', rpcError);
      }
    } catch (error) {
      console.warn('Failed to track test history:', error);
    }
  };

  const updateTestHistory = async (sessionId: string, userResponses: any, scores: any, feedback: any, timeSpent: number) => {
    try {
      const { error: rpcError } = await supabase.rpc('update_test_history', {
        p_session_id: sessionId,
        p_user_responses: userResponses,
        p_scores: scores,
        p_feedback: feedback,
        p_time_spent: timeSpent
      });
      
      if (rpcError) {
        console.warn('RPC update_test_history failed:', rpcError);
      }
    } catch (error) {
      console.warn('Failed to update test history:', error);
    }
  };

  const handleTestComplete = async (responses: any) => {
    if (!sessionId || !testContent) return;

    const timeSpent = testStartTime ? Math.floor((new Date().getTime() - testStartTime.getTime()) / 1000) : 0;
    setIsGeneratingFeedback(true);
    
    try {
      // Generate comprehensive AI feedback
      const feedbackPrompt = `
        As an expert IELTS examiner, analyze this ${skillType} test response and provide detailed, professional feedback following official IELTS criteria:
        
        Test Content: ${JSON.stringify(testContent.content)}
        User Responses: ${JSON.stringify(responses)}
        
        Provide comprehensive analysis for IELTS ${skillType} criteria with specific band scores (0-9, rounded to nearest 0.5):
        ${skillType === 'writing' ? `
        - Task Achievement (Task 1) / Task Response (Task 2): Detailed band score analysis
        - Coherence and Cohesion: Specific examples and band score
        - Lexical Resource: Vocabulary analysis with band score  
        - Grammatical Range and Accuracy: Grammar evaluation with band score
        ` : skillType === 'speaking' ? `
        - Fluency and Coherence: Flow and organization analysis with band score
        - Lexical Resource: Vocabulary variety and appropriateness with band score
        - Grammatical Range and Accuracy: Grammar complexity and accuracy with band score
        - Pronunciation: Clarity and natural rhythm assessment with band score
        ` : `
        - Main Ideas: Understanding central concepts with band score
        - Supporting Details: Identifying specific information with band score
        - Inference: Drawing logical conclusions with band score
        - Global Understanding: Overall comprehension with band score
        `}
        
        Format as JSON:
        {
          "overall_score": number (0-9, average of all criteria, rounded to nearest 0.5),
          "category_scores": {
            "criterion1": number,
            "criterion2": number,
            "criterion3": number,
            "criterion4": number
          },
          "strengths": [5-7 specific positive aspects with examples],
          "improvements": [5-7 specific areas to improve with actionable advice],
          "detailed_feedback": "Comprehensive paragraph explaining overall performance with specific references",
          "band_descriptors": {
            "criterion1": "Detailed explanation with specific examples",
            "criterion2": "Detailed explanation with specific examples",
            "criterion3": "Detailed explanation with specific examples",
            "criterion4": "Detailed explanation with specific examples"
          }
        }
      `;

      let feedback: AIFeedback;
      
      try {
        const feedbackResponse = await supabase.functions.invoke('gemini-chat', {
          body: {
            message: feedbackPrompt,
            context: `IELTS ${skillType} comprehensive feedback analysis`
          }
        });

        if (feedbackResponse.error) {
          throw feedbackResponse.error;
        }

        try {
          feedback = JSON.parse(feedbackResponse.data.response);
          
          // Ensure scores are properly formatted (rounded to nearest 0.5)
          feedback.overall_score = getDisplayScore(feedback.overall_score);
          Object.keys(feedback.category_scores).forEach(key => {
            feedback.category_scores[key] = getDisplayScore(feedback.category_scores[key]);
          });
        } catch {
          throw new Error('Failed to parse AI feedback');
        }
      } catch (feedbackError) {
        console.warn('AI feedback generation failed, using fallback:', feedbackError);
        feedback = generateFallbackFeedback(skillType, responses);
      }

      // Update session with results - cast feedback to Json compatible type
      const feedbackAsJson = JSON.parse(JSON.stringify(feedback));
      
      const { error: updateError } = await supabase
        .from('ai_test_sessions')
        .update({
          user_responses: responses,
          ai_feedback: feedbackAsJson,
          band_scores: feedback.category_scores,
          overall_band_score: feedback.overall_score,
          completed_at: new Date().toISOString(),
          time_spent: timeSpent
        })
        .eq('id', sessionId);

      if (updateError) {
        console.error('Failed to save session results:', updateError);
      }

      // Update test history
      await updateTestHistory(sessionId, responses, feedback.category_scores, feedbackAsJson, timeSpent);

      setAiFeedback(feedback);
      setShowResults(true);
      setShowTest(false);

      toast({
        title: "Test Completed!",
        description: `Your overall band score: ${Math.floor(feedback.overall_score)}/9`
      });

    } catch (error) {
      console.error('Error in feedback generation:', error);
      const fallbackFeedback = generateFallbackFeedback(skillType, responses);
      setAiFeedback(fallbackFeedback);
      setShowResults(true);
      setShowTest(false);
      
      toast({
        title: "Test Completed",
        description: "Test completed with standard feedback."
      });
    } finally {
      setIsGeneratingFeedback(false);
    }
  };

  const generateFallbackFeedback = (skill: string, responses: any): AIFeedback => {
    const skillCriteria = {
      listening: ['main_ideas', 'supporting_details', 'inference', 'global_understanding'],
      reading: ['main_ideas', 'supporting_details', 'inference', 'global_understanding'], 
      writing: ['task_achievement', 'coherence_cohesion', 'lexical_resource', 'grammatical_range'],
      speaking: ['fluency_coherence', 'lexical_resource', 'grammatical_range', 'pronunciation']
    };

    const criteria = skillCriteria[skill as keyof typeof skillCriteria];
    const scores = criteria.reduce((acc, criterion) => {
      acc[criterion] = getDisplayScore(6.0 + Math.random() * 2.0); // Random score between 6.0-8.0
      return acc;
    }, {} as { [key: string]: number });

    const overallScore = Object.values(scores).reduce((sum, score) => sum + score, 0) / Object.values(scores).length;

    return {
      overall_score: getDisplayScore(overallScore),
      category_scores: scores,
      strengths: [
        "Demonstrates solid understanding of main concepts and key information",
        "Shows clear communication and logical organization of ideas", 
        "Uses appropriate vocabulary for the context and demonstrates good range",
        "Maintains structured approach with good time management",
        "Displays competent handling of test format and requirements"
      ],
      improvements: [
        "Focus on improving accuracy in identifying specific details and nuances",
        "Expand vocabulary range to express ideas more precisely and naturally",
        "Work on developing more complex grammatical structures confidently",
        "Practice time management to ensure complete and thorough responses",
        "Enhance ability to make sophisticated inferences from given information"
      ],
      detailed_feedback: `Your performance in this ${skill} test demonstrates solid competency with several notable strengths. You show good understanding of the material and communicate ideas effectively with appropriate strategies. The response indicates familiarity with test format and sound approach to the tasks. To achieve higher band scores, focus on the specific improvement areas mentioned above, particularly enhancing precision in details and expanding linguistic range. Continue practicing with authentic IELTS materials to build confidence and refine skills systematically.`,
      band_descriptors: criteria.reduce((acc, criterion) => {
        const key = criterion;
        acc[key] = `Shows good control with generally appropriate usage and effective communication. Minor errors occur but do not impede understanding. Performance demonstrates ${scores[key]} band level competency with room for development.`;
        return acc;
      }, {} as { [key: string]: string })
    };
  };

  const handleStartTest = async () => {
    if (!testContent) {
      toast({
        title: "No Test Selected",
        description: "Please select a test first.",
        variant: "destructive"
      });
      return;
    }

    // Create test session
    const { data: session, error: sessionError } = await supabase
      .from('ai_test_sessions')
      .insert({
        user_id: user!.id,
        test_id: testContent.isPreGenerated ? testContent.id : null,
        skill_type: skillType,
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Failed to create session:', sessionError);
      toast({
        title: "Error",
        description: "Failed to start test session.",
        variant: "destructive"
      });
      return;
    }

    setSessionId(session.id);
    setTestStartTime(new Date());
    setShowTest(true);

    // Track in history
    await insertTestHistory(user!.id, session.id, 'ai', skillType, testContent.content);
  };

  const renderTestComponent = () => {
    if (!testContent || !sessionId) return null;

    const commonProps = {
      testData: testContent.content,
      sessionId,
      onComplete: handleTestComplete
    };

    switch (skillType) {
      case 'listening':
        return <ListeningTest {...commonProps} onExplainAnswer={() => {}} />;
      case 'reading':
        return <ReadingTest {...commonProps} onExplainAnswer={() => {}} />;
      case 'writing':
        return <WritingTest {...commonProps} onSave={() => {}} />;
      case 'speaking':
        return <SpeakingTest {...commonProps} />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="border-2 border-dashed border-blue-300">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="relative">
              <Brain className="h-16 w-16 text-blue-600 animate-pulse" />
              <div className="absolute -top-2 -right-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            </div>
            <h3 className="text-xl font-semibold mt-4 mb-2">Generating Your AI Test</h3>
            <p className="text-gray-600 text-center max-w-md">
              Our AI is creating a personalized {skillType} test based on real IELTS exam patterns. This may take a moment...
            </p>
            <div className="flex items-center mt-4 space-x-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showResults && aiFeedback) {
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Results Header */}
        <Card className="border-l-4 border-l-green-500 bg-gradient-to-r from-green-50 to-emerald-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-green-100 rounded-full">
                  <Trophy className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-green-800">IELTS Test Results</CardTitle>
                  <p className="text-green-600">AI-Powered {skillType.charAt(0).toUpperCase() + skillType.slice(1)} Assessment</p>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-5xl font-bold ${getScoreColor(aiFeedback.overall_score)}`}>
                  {Math.floor(aiFeedback.overall_score)}
                </div>
                <div className="text-sm text-green-600 font-medium">Overall Band Score</div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* IELTS Criteria Breakdown */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="flex items-center space-x-2 text-blue-800">
              <Star className="h-6 w-6" />
              <span>IELTS Assessment Criteria</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(aiFeedback.category_scores).map(([category, score]) => {
                const displayScore = Math.floor(score);
                return (
                  <div key={category} className="bg-white border-2 border-gray-100 rounded-lg p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-800 capitalize text-lg">
                        {category.replace(/_/g, ' ')}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <span className={`text-3xl font-bold ${getScoreColor(score)}`}>
                          {displayScore}
                        </span>
                        <span className="text-sm text-gray-500">/9</span>
                      </div>
                    </div>
                    <div className="mb-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`bg-gradient-to-r ${getProgressColor(score)} h-2 rounded-full transition-all duration-500`}
                          style={{ width: `${(displayScore / 9) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 italic leading-relaxed">
                      {aiFeedback.band_descriptors[category] || 'Shows competent performance in this area with room for development'}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Detailed Feedback */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-l-4 border-l-green-500 shadow-lg">
            <CardHeader className="bg-green-50">
              <CardTitle className="text-green-700 flex items-center space-x-2">
                <CheckCircle className="h-5 w-5" />
                <span>Strengths</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ul className="space-y-3">
                {aiFeedback.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span className="text-gray-700 leading-relaxed">{strength}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500 shadow-lg">
            <CardHeader className="bg-orange-50">
              <CardTitle className="text-orange-700 flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Areas for Improvement</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ul className="space-y-3">
                {aiFeedback.improvements.map((improvement, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <div className="w-3 h-3 bg-orange-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span className="text-gray-700 leading-relaxed">{improvement}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Professional Feedback Report */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
            <CardTitle className="text-purple-800">Examiner's Detailed Report</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed text-lg font-light">
                {aiFeedback.detailed_feedback}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4 pt-6">
          <Button 
            onClick={loadNextTest} 
            variant="outline" 
            size="lg" 
            className="px-8"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Next Test
          </Button>
          <Button 
            onClick={selectRandomTest} 
            variant="outline" 
            size="lg" 
            className="px-8"
          >
            <Shuffle className="h-4 w-4 mr-2" />
            Random Test
          </Button>
          <Button 
            onClick={generateFreshAITest} 
            variant="outline" 
            size="lg" 
            className="px-8"
          >
            <Brain className="h-4 w-4 mr-2" />
            Generate New
          </Button>
          <Button onClick={onBack} size="lg" className="px-8">
            Back to Skills
          </Button>
        </div>
      </div>
    );
  }

  if (showTest && testContent) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <Button onClick={onBack} variant="outline">
            ← Back to Skills
          </Button>
        </div>
        {isGeneratingFeedback && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardContent className="py-4">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span className="text-blue-700 font-medium">Generating comprehensive AI feedback...</span>
              </div>
            </CardContent>
          </Card>
        )}
        {renderTestComponent()}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className={`border-2 bg-gradient-to-r ${skillColors[skillType as keyof typeof skillColors]} text-white shadow-xl`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 rounded-full">
                {skillIcons[skillType as keyof typeof skillIcons]}
              </div>
              <div>
                <CardTitle className="text-2xl">AI-Generated {skillType.charAt(0).toUpperCase() + skillType.slice(1)} Test</CardTitle>
                <p className="text-white/90">Smart test selection with consistent content</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              AI Powered
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {testContent && (
            <div className="bg-white/10 rounded-lg p-4">
              <h3 className="font-semibold mb-2">
                Current Test: {testContent.topic}
                {testContent.isPreGenerated && (
                  <Badge variant="secondary" className="ml-2 bg-green-500/20 text-white">
                    Pre-generated
                  </Badge>
                )}
              </h3>
              <p className="text-white/90 text-sm">
                Available tests: {availableTests.length} | 
                {testContent.isPreGenerated ? ' Using curated content' : ' Freshly generated'}
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <Database className="h-8 w-8 mx-auto mb-2" />
              <div className="font-semibold">Smart Selection</div>
              <div className="text-sm text-white/80">Consistent test rotation</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <Clock className="h-8 w-8 mx-auto mb-2" />
              <div className="font-semibold">Real IELTS Format</div>
              <div className="text-sm text-white/80">Authentic test structure</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <Trophy className="h-8 w-8 mx-auto mb-2" />
              <div className="font-semibold">Detailed Feedback</div>
              <div className="text-sm text-white/80">All IELTS criteria covered</div>
            </div>
          </div>

          {/* Test Selection Options */}
          <div className="bg-white/10 rounded-lg p-4">
            <h3 className="font-semibold mb-3">Choose Test Option:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Button 
                onClick={handleStartTest} 
                size="lg" 
                className="bg-white text-gray-900 hover:bg-white/90 font-semibold"
                disabled={!testContent}
              >
                <Database className="h-4 w-4 mr-2" />
                Start Current
              </Button>
              <Button 
                onClick={loadNextTest} 
                size="lg" 
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 font-semibold"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Next Test
              </Button>
              <Button 
                onClick={selectRandomTest} 
                size="lg" 
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 font-semibold"
              >
                <Shuffle className="h-4 w-4 mr-2" />
                Random
              </Button>
              <Button 
                onClick={generateFreshAITest} 
                size="lg" 
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 font-semibold"
              >
                <Brain className="h-4 w-4 mr-2" />
                Generate New
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AITestSession;
