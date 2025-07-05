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

  // Topic arrays for different content types
  const topics = {
    listening: [
      'university course enrollment', 'job interview at tech company', 'apartment rental inquiry',
      'library book reservation', 'travel booking conversation', 'restaurant reservation',
      'medical appointment scheduling', 'banking services inquiry', 'fitness center membership',
      'online shopping customer service', 'academic conference registration', 'hotel check-in process'
    ],
    reading: [
      'Climate Change and Renewable Energy', 'Artificial Intelligence in Healthcare',
      'Urban Planning and Smart Cities', 'The Psychology of Social Media',
      'Biodiversity Conservation Strategies', 'The Future of Remote Work',
      'Space Exploration Technologies', 'Sustainable Agriculture Practices',
      'Digital Privacy and Data Protection', 'The Evolution of Transportation',
      'Mental Health in Modern Society', 'Renewable Energy Solutions'
    ],
    writing: [
      'environmental protection vs economic growth', 'online education vs traditional classroom learning',
      'social media impact on society', 'technology replacing human workers',
      'urban living vs rural living', 'public transportation vs private vehicles',
      'fast food culture and health', 'globalization effects on local cultures',
      'renewable energy investments', 'work-life balance in modern society',
      'artificial intelligence benefits and risks', 'space exploration funding priorities'
    ],
    speaking: [
      'describe a memorable childhood experience', 'describe a place you would like to visit',
      'describe a skill you want to learn', 'describe a book that influenced you',
      'describe a technological device you find useful', 'describe a person who inspires you',
      'describe a festival or celebration in your country', 'describe a hobby you enjoy',
      'describe a challenging experience you overcame', 'describe your ideal vacation',
      'describe a meal you really enjoyed', 'describe a piece of art you admire'
    ]
  };

  useEffect(() => {
    generateOrLoadContent();
  }, [skillType]);

  const getRandomTopic = (skill: string) => {
    const skillTopics = topics[skill as keyof typeof topics] || topics.reading;
    return skillTopics[Math.floor(Math.random() * skillTopics.length)];
  };

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
        const randomTopic = getRandomTopic(skillType);
        const prompt = generatePromptForSkill(skillType, randomTopic);
        
        const { data: aiData, error: aiError } = await supabase.functions.invoke('gemini-chat', {
          body: { message: prompt }
        });

        if (aiError) throw aiError;

        const content = aiData.response;
        const processedData = processAIContent(skillType, content, randomTopic);
        setSessionData(processedData);
        setUsePreGenerated(false);

        // Store the generated content in database
        await supabase
          .from('content_items')
          .insert({
            title: `${skillType.charAt(0).toUpperCase() + skillType.slice(1)} - ${randomTopic}`,
            type: skillType,
            skill_type: skillType,
            content: processedData,
            created_by: user.id,
            is_active: true
          });

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

  const generatePromptForSkill = (skill: string, topic: string): string => {
    switch (skill) {
      case 'listening':
        return `Generate a complete IELTS Listening test about "${topic}". Create:
        1. A realistic conversation transcript between 2-3 people (300-400 words)
        2. 10 mixed questions: 3 multiple choice, 4 fill-in-the-blank, 3 matching/labelling
        3. Clear answer key with explanations
        4. Make it engaging and authentic
        Format as JSON: {"transcript": "...", "questions": [...], "answers": [...], "explanations": [...]}`;
      
      case 'reading':
        return `Generate a complete IELTS Reading passage about "${topic}". Create:
        1. An academic text of 500-600 words with clear paragraphs (A, B, C, D)
        2. 10 questions: 5 True/False/Not Given, 3 multiple choice, 2 summary completion
        3. Answer key with detailed explanations
        4. Make it informative and well-structured
        Format as JSON: {"passage": "...", "questions": [...], "answers": [...], "explanations": [...]}`;
      
      case 'writing':
        return `Generate IELTS Writing tasks about "${topic}":
        1. Task 1: Create a chart/graph description task with sample data
        2. Task 2: An argumentative essay question related to the topic
        3. Assessment criteria and band descriptors
        4. Sample response excerpts
        Format as JSON: {"task1": {...}, "task2": {...}, "criteria": [...], "samples": [...]}`;
      
      case 'speaking':
        return `Generate IELTS Speaking test about "${topic}":
        1. Part 1: 4 warm-up questions about daily life
        2. Part 2: Cue card about "${topic}" with 4 bullet points
        3. Part 3: 4 abstract discussion questions related to the topic
        4. Assessment criteria and band descriptors
        Format as JSON: {"part1": [...], "part2": {...}, "part3": [...], "criteria": [...]}`;
      
      default:
        return `Generate a comprehensive IELTS ${skill} test about "${topic}".`;
    }
  };

  const processAIContent = (skill: string, content: string, topic: string) => {
    try {
      const parsed = JSON.parse(content);
      return {
        type: skill,
        topic: topic,
        generated_by: 'ai',
        ...parsed,
        created_at: new Date().toISOString()
      };
    } catch (error) {
      console.warn('Failed to parse AI content as JSON, using fallback structure');
      return {
        type: skill,
        topic: topic,
        generated_by: 'ai',
        content: content,
        questions: generateFallbackQuestions(skill),
        created_at: new Date().toISOString()
      };
    }
  };

  const getFallbackContent = (skill: string) => {
    const randomTopic = getRandomTopic(skill);
    const fallbackData = {
      listening: {
        type: 'listening',
        topic: randomTopic,
        section: 1,
        transcript: `Welcome to the ${randomTopic} conversation. In this listening exercise, you will hear a detailed discussion about ${randomTopic}. Pay attention to specific details, dates, and key information mentioned throughout the conversation.`,
        audioUrl: null,
        questions: [
          {
            type: 'multiple_choice',
            question: `What is the main focus of the ${randomTopic} discussion?`,
            options: ['Technical aspects', 'General overview', 'Specific procedures', 'Future developments']
          },
          {
            type: 'fill_blank',
            question: `The speaker mentions that ${randomTopic} requires ________ preparation.`
          }
        ]
      },
      reading: {
        type: 'reading',
        topic: randomTopic,
        passage: `<h3>${randomTopic}</h3>
        <p><strong>A</strong> ${randomTopic} has become increasingly important in today's world. Recent studies show significant developments in this field, with researchers making breakthrough discoveries that could revolutionize our understanding.</p>
        <p><strong>B</strong> The implications of ${randomTopic} extend far beyond initial expectations. Experts argue that the long-term effects will be substantial, potentially affecting various sectors of society and industry.</p>
        <p><strong>C</strong> However, challenges remain in implementing effective strategies related to ${randomTopic}. Critics point out several limitations that need to be addressed before widespread adoption can occur.</p>
        <p><strong>D</strong> Looking forward, the future of ${randomTopic} appears promising. Continued research and development in this area are expected to yield significant benefits for society as a whole.</p>`,
        questions: generateFallbackQuestions('reading')
      },
      writing: {
        type: 'writing',
        topic: randomTopic,
        task1: {
          prompt: `The chart shows data related to ${randomTopic} in three different regions over a 10-year period. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.`,
          image: null
        },
        task2: {
          prompt: `Some people believe that ${randomTopic} has more advantages than disadvantages, while others argue the opposite. Discuss both views and give your own opinion. Give reasons for your answer and include relevant examples from your knowledge or experience.`
        }
      },
      speaking: {
        type: 'speaking',
        topic: randomTopic,
        part1: [
          'How often do you think about topics like this in your daily life?',
          'What experiences have you had related to this topic?',
          'Do you find this topic interesting? Why or why not?',
          'How important is this topic in your country?'
        ],
        part2: {
          topic: `Describe ${randomTopic}`,
          points: [
            'what it involves',
            'why it is important',
            'how it affects people',
            'what you think about it'
          ]
        },
        part3: [
          'How do you think this topic will develop in the future?',
          'What are the main challenges related to this topic?',
          'How do different generations view this topic?',
          'What role should governments play in addressing this topic?'
        ]
      }
    };

    return fallbackData[skill as keyof typeof fallbackData] || fallbackData.reading;
  };

  const generateFallbackQuestions = (skill: string) => {
    switch (skill) {
      case 'reading':
        return [
          'The topic has become increasingly important in recent years.',
          'Researchers have made significant breakthrough discoveries.',
          'All experts agree on the implementation strategies.',
          'There are challenges in widespread adoption.',
          'The future outlook is entirely negative.'
        ];
      default:
        return ['Sample question 1', 'Sample question 2', 'Sample question 3'];
    }
  };

  const calculateBandScore = (userResponse: any, skillType: string): number => {
    if (!userResponse) return 5.0;

    switch (skillType) {
      case 'reading':
      case 'listening':
        // Calculate based on correct answers
        let correctAnswers = 0;
        let totalQuestions = 0;
        
        if (typeof userResponse === 'object') {
          const answers = Object.values(userResponse);
          totalQuestions = answers.length;
          
          // Simple scoring logic - in real IELTS this would be more complex
          answers.forEach((answer: any) => {
            if (answer && typeof answer === 'string' && answer.trim().length > 0) {
              correctAnswers++;
            }
          });
        }
        
        const percentage = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
        
        // Convert percentage to IELTS band score
        if (percentage >= 90) return 9.0;
        if (percentage >= 80) return 8.0;
        if (percentage >= 70) return 7.0;
        if (percentage >= 60) return 6.5;
        if (percentage >= 50) return 6.0;
        if (percentage >= 40) return 5.5;
        if (percentage >= 30) return 5.0;
        if (percentage >= 20) return 4.5;
        return 4.0;

      case 'writing':
        // For writing, analyze word count and complexity
        const text = typeof userResponse === 'string' ? userResponse : 
                    userResponse?.task1 + ' ' + userResponse?.task2 || '';
        const wordCount = text.split(' ').length;
        
        if (wordCount >= 300) return Math.min(8.0, 6.0 + Math.random() * 2);
        if (wordCount >= 250) return Math.min(7.0, 5.5 + Math.random() * 1.5);
        if (wordCount >= 200) return Math.min(6.5, 5.0 + Math.random() * 1.5);
        if (wordCount >= 150) return Math.min(6.0, 4.5 + Math.random() * 1.5);
        return Math.min(5.5, 4.0 + Math.random() * 1.5);

      case 'speaking':
        // For speaking, consider duration and responses
        const responses = userResponse?.responses || [];
        const totalDuration = responses.reduce((sum: number, r: any) => sum + (r.duration || 0), 0);
        
        if (totalDuration >= 300) return Math.min(8.0, 6.0 + Math.random() * 2);
        if (totalDuration >= 240) return Math.min(7.0, 5.5 + Math.random() * 1.5);
        if (totalDuration >= 180) return Math.min(6.5, 5.0 + Math.random() * 1.5);
        if (totalDuration >= 120) return Math.min(6.0, 4.5 + Math.random() * 1.5);
        return Math.min(5.5, 4.0 + Math.random() * 1.5);

      default:
        return 6.0;
    }
  };

  const handleTestComplete = async (userResponse: any) => {
    if (!sessionId) return;

    setIsLoading(true);
    try {
      // Calculate band score before AI feedback
      const calculatedScore = calculateBandScore(userResponse, skillType);
      
      // Create detailed feedback prompt for proper band scoring
      const feedbackPrompt = `As a certified IELTS examiner, provide professional feedback for this ${skillType} response. 
      
      User Response: ${JSON.stringify(userResponse)}
      Calculated Band Score: ${calculatedScore}
      
      Provide feedback in this exact format without any asterisks or markdown formatting:

      OVERALL BAND SCORE: ${calculatedScore}
      
      DETAILED ASSESSMENT:
      
      ${skillType === 'writing' ? `
      Task Achievement: ${Math.max(4.0, calculatedScore - 0.5)} - Analysis of how well the task requirements are addressed
      Coherence and Cohesion: ${Math.max(4.0, calculatedScore - 0.3)} - Organization and logical flow of ideas
      Lexical Resource: ${Math.max(4.0, calculatedScore - 0.2)} - Vocabulary range, accuracy and appropriateness
      Grammatical Range and Accuracy: ${Math.max(4.0, calculatedScore - 0.4)} - Grammar complexity and correctness
      ` : skillType === 'speaking' ? `
      Fluency and Coherence: ${Math.max(4.0, calculatedScore - 0.3)} - Natural flow and logical organization
      Lexical Resource: ${Math.max(4.0, calculatedScore - 0.2)} - Vocabulary range and appropriateness
      Grammatical Range and Accuracy: ${Math.max(4.0, calculatedScore - 0.4)} - Grammar complexity and accuracy
      Pronunciation: ${Math.max(4.0, calculatedScore - 0.1)} - Clarity and natural speech patterns
      ` : skillType === 'reading' ? `
      Reading Comprehension: ${Math.max(4.0, calculatedScore - 0.2)} - Understanding of text and questions
      Task Response: ${Math.max(4.0, calculatedScore - 0.3)} - Accuracy in answering different question types
      Time Management: ${Math.max(4.0, calculatedScore - 0.1)} - Efficiency in completing tasks
      ` : `
      Listening Skills: ${Math.max(4.0, calculatedScore - 0.2)} - Understanding of audio content
      Task Response: ${Math.max(4.0, calculatedScore - 0.3)} - Accuracy in answering questions
      Note-taking: ${Math.max(4.0, calculatedScore - 0.1)} - Ability to capture key information
      `}
      
      STRENGTHS:
      - Provide 3-4 specific positive aspects of the performance
      
      AREAS FOR IMPROVEMENT:
      - Provide 3-4 specific areas that need development
      
      RECOMMENDATIONS:
      - Provide 3-4 actionable study suggestions
      
      EXAMINER COMMENTS:
      Professional summary of performance with specific examples from the response.
      
      Use professional language suitable for official IELTS feedback. Do not use asterisks, markdown formatting, or casual language.`;
      
      const { data: feedbackData, error: feedbackError } = await supabase.functions.invoke('gemini-chat', {
        body: { message: feedbackPrompt }
      });

      let feedback = 'Unable to generate detailed feedback at this time.';
      if (!feedbackError && feedbackData?.response) {
        feedback = feedbackData.response;
      }

      // Update the practice session with calculated score
      const { error: updateError } = await supabase
        .from('practice_sessions')
        .update({
          session_data: {
            ...sessionData,
            user_response: userResponse,
            completed_at: new Date().toISOString(),
            use_pre_generated: usePreGenerated
          },
          score: calculatedScore,
          ai_feedback: feedback,
          completed_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }

      setAiResponse(feedback);
      setShowResults(true);
      
      toast({
        title: "Test Completed!",
        description: `Your ${skillType} test has been evaluated. Score: ${calculatedScore}/9`
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
      const explainPrompt = `As an IELTS expert, explain the answer to this ${skillType} question:
      
      Question: ${question?.question || `Question ${questionIndex + 1}`}
      
      Please provide:
      1. The correct answer and why it is correct
      2. Why other options are incorrect (if applicable)
      3. Key strategies for similar questions
      4. Common mistakes to avoid
      
      Use clear, educational language without asterisks or markdown formatting.`;

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

        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <CardTitle className="text-2xl text-center text-blue-700">
              Official IELTS Band Score Report
            </CardTitle>
            <p className="text-center text-gray-600 mt-2">
              {skillType.charAt(0).toUpperCase() + skillType.slice(1)} Test Assessment
            </p>
          </CardHeader>
          <CardContent className="p-8">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="prose max-w-none">
                {aiResponse.split('\n').map((line, index) => {
                  const trimmedLine = line.trim();
                  
                  // Handle main headers
                  if (trimmedLine.startsWith('OVERALL BAND SCORE:')) {
                    const score = trimmedLine.split(':')[1]?.trim() || 'N/A';
                    return (
                      <div key={index} className="text-center mb-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 shadow-sm">
                        <h2 className="text-4xl font-bold text-blue-700 mb-2">
                          {score}
                        </h2>
                        <p className="text-lg text-gray-600 font-medium">Overall Band Score</p>
                        <div className="mt-3 px-4 py-2 bg-white rounded-lg inline-block">
                          <span className="text-sm text-gray-500">out of 9.0</span>
                        </div>
                      </div>
                    );
                  }
                  
                  // Handle section headers
                  if (trimmedLine.match(/^(DETAILED ASSESSMENT|STRENGTHS|AREAS FOR IMPROVEMENT|RECOMMENDATIONS|EXAMINER COMMENTS):?$/)) {
                    return (
                      <div key={index} className="mt-8 mb-4">
                        <h3 className="text-xl font-bold text-gray-800 border-b-2 border-blue-200 pb-3 mb-4">
                          {trimmedLine.replace(':', '')}
                        </h3>
                      </div>
                    );
                  }
                  
                  // Handle skill scores with improved styling
                  if (trimmedLine.includes('/9.0') && trimmedLine.includes(':')) {
                    const [skill, rest] = trimmedLine.split(':');
                    const scoreMatch = rest.match(/(\d+\.?\d*)/);
                    const score = scoreMatch ? parseFloat(scoreMatch[1]) : 0;
                    const description = rest.replace(/\d+\.?\d*/, '').replace(' - ', '').trim();
                    
                    const getScoreColor = (score: number) => {
                      if (score >= 8.0) return 'bg-green-100 text-green-800 border-green-300';
                      if (score >= 7.0) return 'bg-blue-100 text-blue-800 border-blue-300';
                      if (score >= 6.0) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
                      if (score >= 5.0) return 'bg-orange-100 text-orange-800 border-orange-300';
                      return 'bg-red-100 text-red-800 border-red-300';
                    };
                    
                    return (
                      <div key={index} className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-800 text-lg mb-1">{skill.trim()}</h4>
                            <p className="text-gray-600 text-sm">{description}</p>
                          </div>
                          <div className="ml-4">
                            <div className={`px-4 py-2 rounded-full border-2 font-bold text-lg ${getScoreColor(score)}`}>
                              {score.toFixed(1)}/9.0
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  
                  // Handle bullet points with better styling
                  if (trimmedLine.startsWith('-')) {
                    return (
                      <div key={index} className="flex items-start mb-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-4 flex-shrink-0"></div>
                        <p className="text-gray-700 leading-relaxed">{trimmedLine.substring(1).trim()}</p>
                      </div>
                    );
                  }
                  
                  // Handle regular paragraphs
                  if (trimmedLine && !trimmedLine.match(/^(DETAILED ASSESSMENT|STRENGTHS|AREAS FOR IMPROVEMENT|RECOMMENDATIONS|EXAMINER COMMENTS):?$/)) {
                    return (
                      <div key={index} className="mb-4 p-4 bg-white rounded-lg border border-gray-100 shadow-sm">
                        <p className="text-gray-700 leading-relaxed font-medium">
                          {trimmedLine}
                        </p>
                      </div>
                    );
                  }
                  
                  return null;
                })}
              </div>
            </div>
            
            <div className="flex justify-center space-x-4 mt-8">
              <Button onClick={() => generateOrLoadContent()} className="bg-blue-600 hover:bg-blue-700 px-6 py-3 text-lg">
                Take Another Test
              </Button>
              <Button variant="outline" onClick={onBack} className="px-6 py-3 text-lg">
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
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <div className="text-gray-800 whitespace-pre-wrap">
                  {explanation.replace(/\*\*/g, '').replace(/\*/g, '')}
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
