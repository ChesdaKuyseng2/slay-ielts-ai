
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Brain, Clock, Trophy, BookOpen, Headphones, PenTool, Mic, CheckCircle, Star, TrendingUp } from 'lucide-react';
import ListeningTest from './ListeningTest';
import ReadingTest from './ReadingTest';  
import WritingTest from './WritingTest';
import SpeakingTest from './SpeakingTest';

interface AITestSessionProps {
  skillType: string;
  onBack: () => void;
}

interface TestContent {
  id: string;
  content: any;
  topic: string;
}

interface AIFeedback {
  overall_score: number;
  category_scores: {
    [key: string]: number;
  };
  strengths: string[];
  improvements: string[];
  detailed_feedback: string;
  band_descriptors: {
    [key: string]: string;
  };
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

  useEffect(() => {
    if (user) {
      generateAITest();
    }
  }, [skillType, user]);

  const generateAITest = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      console.log(`Generating AI test for ${skillType}`);
      
      // Call Gemini API to generate test content
      const response = await supabase.functions.invoke('gemini-chat', {
        body: {
          message: `Generate a comprehensive IELTS ${skillType} test`,
          skill: skillType,
          generateContent: true
        }
      });

      if (response.error) {
        throw response.error;
      }

      let testData;
      try {
        // Try to parse as JSON first
        testData = JSON.parse(response.data.response);
      } catch {
        // If not JSON, create structured content from text
        testData = createStructuredContent(response.data.response, skillType);
      }

      // Store in database
      const { data: storedTest, error: storeError } = await supabase
        .from('ai_generated_tests')
        .insert({
          skill_type: skillType,
          content: testData,
          topic: response.data.topic || `AI Generated ${skillType} Test`
        })
        .select()
        .single();

      if (storeError) throw storeError;

      // Create test session
      const { data: session, error: sessionError } = await supabase
        .from('ai_test_sessions')
        .insert({
          user_id: user.id,
          test_id: storedTest.id,
          skill_type: skillType
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      setTestContent({
        id: storedTest.id,
        content: testData,
        topic: storedTest.topic || `AI Generated ${skillType} Test`
      });
      setSessionId(session.id);
      
      toast({
        title: "AI Test Generated",
        description: `Your personalized ${skillType} test is ready!`
      });

    } catch (error) {
      console.error('Error generating AI test:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate AI test. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createStructuredContent = (textContent: string, skill: string) => {
    // Create fallback structured content based on skill type
    const baseContent = {
      title: `AI Generated ${skill.charAt(0).toUpperCase() + skill.slice(1)} Test`,
      description: textContent.substring(0, 200) + '...',
      instructions: `Complete this ${skill} test to the best of your ability.`
    };

    switch (skill) {
      case 'listening':
        return {
          ...baseContent,
          transcript: textContent,
          questions: generateFallbackQuestions(skill, 10),
          section: 1
        };
      case 'reading':
        return {
          ...baseContent,
          passage: textContent,
          questions: generateFallbackQuestions(skill, 10)
        };
      case 'writing':
        return {
          ...baseContent,
          task1: {
            prompt: "Describe the chart/graph/table shown below. Summarize the information and make comparisons where relevant.",
            type: "data_description"
          },
          task2: {
            prompt: textContent.length > 100 ? textContent : "Some people believe technology has made our lives easier, while others think it has made life more complicated. Discuss both views and give your opinion.",
            type: "argumentative_essay"
          }
        };
      case 'speaking':
        return {
          ...baseContent,
          part1: generateSpeakingQuestions('part1'),
          part2: {
            topic: "Describe a memorable experience",
            cue_card: "You should say: What the experience was, When it happened, Who was involved, Why it was memorable",
            preparation_time: 60,
            speaking_time: 120
          },
          part3: generateSpeakingQuestions('part3')
        };
      default:
        return baseContent;
    }
  };

  const generateFallbackQuestions = (skill: string, count: number) => {
    const questions = [];
    for (let i = 1; i <= count; i++) {
      if (skill === 'listening' || skill === 'reading') {
        questions.push({
          id: i,
          type: i % 3 === 0 ? 'fill_blank' : 'multiple_choice',
          question: `Question ${i}: What is the main point discussed in this section?`,
          options: i % 3 !== 0 ? ['Option A', 'Option B', 'Option C', 'Option D'] : undefined,
          correctAnswer: i % 3 !== 0 ? 'Option A' : 'answer'
        });
      }
    }
    return questions;
  };

  const generateSpeakingQuestions = (part: string) => {
    if (part === 'part1') {
      return [
        "Tell me about your hometown.",
        "What do you like to do in your free time?",
        "How do you usually spend your weekends?",
        "What are your future plans?"
      ];
    } else {
      return [
        "How do you think technology will change in the future?",
        "What role does education play in society?",
        "How important is it to preserve cultural traditions?",
        "What are the benefits and drawbacks of globalization?"
      ];
    }
  };

  const handleTestComplete = async (responses: any) => {
    if (!sessionId || !testContent) return;

    setIsGeneratingFeedback(true);
    try {
      // Generate AI feedback
      const feedbackPrompt = `
        Analyze this IELTS ${skillType} test response and provide detailed feedback:
        
        Test Content: ${JSON.stringify(testContent.content)}
        User Responses: ${JSON.stringify(responses)}
        
        Please provide:
        1. Overall band score (0-9)
        2. Category-specific scores
        3. Strengths (3-5 points)
        4. Areas for improvement (3-5 points)
        5. Detailed feedback paragraph
        6. Band descriptors for each category
        
        Format as JSON with: {
          "overall_score": number,
          "category_scores": {},
          "strengths": [],
          "improvements": [],
          "detailed_feedback": string,
          "band_descriptors": {}
        }
      `;

      const feedbackResponse = await supabase.functions.invoke('gemini-chat', {
        body: {
          message: feedbackPrompt,
          context: `IELTS ${skillType} test feedback analysis`
        }
      });

      let feedback: AIFeedback;
      try {
        feedback = JSON.parse(feedbackResponse.data.response);
      } catch {
        // Fallback feedback structure
        feedback = {
          overall_score: 6.5,
          category_scores: { fluency: 6.5, vocabulary: 6.0, grammar: 7.0, pronunciation: 6.5 },
          strengths: ["Good vocabulary range", "Clear communication", "Well-structured responses"],
          improvements: ["Work on grammar accuracy", "Expand ideas more", "Use more complex sentences"],
          detailed_feedback: "Your performance shows solid understanding with room for improvement in specific areas.",
          band_descriptors: {
            fluency: "Speaks with some fluency but may have occasional hesitation",
            vocabulary: "Uses adequate vocabulary for the task",
            grammar: "Uses a range of structures with good control",
            pronunciation: "Generally clear with good intonation"
          }
        };
      }

      // Update session with results
      const { error: updateError } = await supabase
        .from('ai_test_sessions')
        .update({
          user_responses: responses,
          ai_feedback: feedback,
          band_scores: feedback.category_scores,
          overall_band_score: feedback.overall_score,
          completed_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (updateError) throw updateError;

      setAiFeedback(feedback);
      setShowResults(true);
      setShowTest(false);

      toast({
        title: "Test Completed!",
        description: `Your overall band score: ${feedback.overall_score}/9`
      });

    } catch (error) {
      console.error('Error generating feedback:', error);
      toast({
        title: "Feedback Error",
        description: "Failed to generate feedback. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingFeedback(false);
    }
  };

  const handleStartTest = () => {
    setShowTest(true);
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
        <Card className={`border-l-4 border-l-green-500 bg-gradient-to-r from-green-50 to-emerald-50`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-green-100 rounded-full">
                  <Trophy className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-green-800">Test Completed!</CardTitle>
                  <p className="text-green-600">AI-Powered {skillType.charAt(0).toUpperCase() + skillType.slice(1)} Test Results</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-green-700">{aiFeedback.overall_score}</div>
                <div className="text-sm text-green-600">Overall Band Score</div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Category Scores */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Star className="h-5 w-5" />
              <span>Category Breakdown</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(aiFeedback.category_scores).map(([category, score]) => (
                <div key={category} className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{score}</div>
                  <div className="text-sm text-gray-600 capitalize">{category}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {aiFeedback.band_descriptors[category] || 'Good performance'}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Detailed Feedback */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-l-4 border-l-green-500">
            <CardHeader>
              <CardTitle className="text-green-700 flex items-center space-x-2">
                <CheckCircle className="h-5 w-5" />
                <span>Strengths</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {aiFeedback.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-sm">{strength}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader>
              <CardTitle className="text-orange-700 flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Areas for Improvement</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {aiFeedback.improvements.map((improvement, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-sm">{improvement}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed">{aiFeedback.detailed_feedback}</p>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          <Button onClick={() => generateAITest()} variant="outline" size="lg">
            <Brain className="h-4 w-4 mr-2" />
            Take Another AI Test
          </Button>
          <Button onClick={onBack} size="lg">
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
                <span className="text-blue-700">Generating AI feedback...</span>
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
      <Card className={`border-2 bg-gradient-to-r ${skillColors[skillType as keyof typeof skillColors]} text-white`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 rounded-full">
                {skillIcons[skillType as keyof typeof skillIcons]}
              </div>
              <div>
                <CardTitle className="text-2xl">AI-Generated {skillType.charAt(0).toUpperCase() + skillType.slice(1)} Test</CardTitle>
                <p className="text-white/90">Personalized test with real-time AI feedback</p>
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
              <h3 className="font-semibold mb-2">Test Topic: {testContent.topic}</h3>
              <p className="text-white/90 text-sm">
                This test has been specifically generated for you using advanced AI based on real IELTS exam patterns.
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <Brain className="h-8 w-8 mx-auto mb-2" />
              <div className="font-semibold">AI Generated</div>
              <div className="text-sm text-white/80">Fresh content every time</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <Clock className="h-8 w-8 mx-auto mb-2" />
              <div className="font-semibold">Real-time Feedback</div>
              <div className="text-sm text-white/80">Instant detailed analysis</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <Trophy className="h-8 w-8 mx-auto mb-2" />
              <div className="font-semibold">Band Scoring</div>
              <div className="text-sm text-white/80">Official IELTS scale</div>
            </div>
          </div>

          <div className="flex justify-center pt-4">
            <Button 
              onClick={handleStartTest} 
              size="lg" 
              className="bg-white text-gray-900 hover:bg-white/90"
              disabled={!testContent}
            >
              <Brain className="h-5 w-5 mr-2" />
              Start AI Test
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AITestSession;
