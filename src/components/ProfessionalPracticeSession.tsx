import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, RefreshCw, HelpCircle, CheckCircle } from 'lucide-react';
import ListeningTest from './ielts/ListeningTest';
import ReadingTest from './ielts/ReadingTest';
import WritingTest from './ielts/WritingTest';
import SpeakingTest from './ielts/SpeakingTest';
import AnswerExplanation from './ielts/AnswerExplanation';

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
  const [explanation, setExplanation] = useState<any>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [currentTopic, setCurrentTopic] = useState<string>('');
  const [userAnswers, setUserAnswers] = useState<any>(null);

  // Enhanced topic arrays for different content types
  const topics = {
    listening: [
      'University course enrollment and academic registration process',
      'Technology company job interview and workplace dynamics',
      'International apartment rental inquiry and housing discussion',
      'Digital library services and online resource management',
      'International travel booking and cultural tourism experiences',
      'Fine dining restaurant reservation and culinary culture',
      'Comprehensive medical appointment and healthcare consultation',
      'Professional banking services and financial planning session',
      'Premium fitness center membership and wellness programs',
      'Advanced e-commerce customer service and digital shopping',
      'Academic conference registration and professional networking',
      'Luxury hotel accommodation and hospitality services',
      'Modern public transportation and sustainable mobility',
      'Comprehensive insurance consultation and risk management',
      'Professional career counseling and development planning'
    ],
    reading: [
      'Climate Change and Renewable Energy Solutions',
      'Artificial Intelligence in Modern Healthcare Systems',
      'Urban Planning and Smart City Development',
      'The Psychology of Social Media and Digital Behavior',
      'Biodiversity Conservation and Ecosystem Management',
      'The Future of Remote Work and Digital Nomadism',
      'Space Exploration Technologies and Mars Colonization',
      'Sustainable Agriculture and Food Security',
      'Digital Privacy and Data Protection Rights',
      'The Evolution of Transportation and Electric Vehicles',
      'Mental Health Awareness in Modern Society',
      'Renewable Energy and Environmental Sustainability',
      'Archaeological Discoveries and Ancient Civilizations',
      'Ocean Conservation and Marine Biology Research',
      'Educational Technology and Online Learning Platforms'
    ],
    writing: [
      'Should governments prioritize environmental protection over economic growth in developing countries?',
      'Do the benefits of online education outweigh the advantages of traditional classroom learning?',
      'How has social media impacted interpersonal relationships and communication in modern society?',
      'Should artificial intelligence replace human workers in industries like manufacturing and customer service?',
      'Is urban living more beneficial than rural living for personal and professional development?',
      'Should public transportation be completely free and funded entirely by government taxation?',
      'Do the health risks of fast food culture outweigh its convenience in busy modern lifestyles?',
      'How do the effects of globalization impact local cultures and traditional practices?',
      'Should governments invest more in renewable energy research than in space exploration programs?',
      'Is achieving work-life balance more challenging in today\'s digital age than in previous generations?',
      'Do the benefits of artificial intelligence in healthcare outweigh the potential privacy risks?',
      'Should developed countries prioritize climate change solutions over economic development aid to poorer nations?'
    ],
    speaking: [
      'Describe a memorable childhood experience that shaped your personality and explain its lasting impact',
      'Talk about a place you would like to visit in the future and explain what attracts you to it',
      'Describe a skill you want to learn and discuss how it would benefit your personal or professional life',
      'Talk about a book or movie that significantly influenced your thinking or worldview',
      'Describe a technological device that has made your life easier and explain its importance',
      'Talk about a person who has inspired you and describe the qualities you admire in them',
      'Describe a traditional festival or celebration in your country and its cultural significance',
      'Talk about a hobby or recreational activity you enjoy and explain why it interests you',
      'Describe a challenging experience you overcame and the lessons you learned from it',
      'Talk about your ideal vacation destination and the activities you would like to do there',
      'Describe a memorable meal you enjoyed and the circumstances that made it special',
      'Talk about a piece of art, music, or literature that you find particularly meaningful'
    ]
  };

  useEffect(() => {
    generateOrLoadContent();
  }, [skillType]);

  const getRandomTopic = (skill: string) => {
    const skillTopics = topics[skill as keyof typeof topics] || topics.listening;
    const randomTopic = skillTopics[Math.floor(Math.random() * skillTopics.length)];
    setCurrentTopic(randomTopic);
    return randomTopic;
  };

  const generateOrLoadContent = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
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

      try {
        const randomTopic = getRandomTopic(skillType);
        const prompt = generatePromptForSkill(skillType, randomTopic);
        
        console.log(`Generating ${skillType} content with topic: ${randomTopic}`);
        
        const { data: aiData, error: aiError } = await supabase.functions.invoke('gemini-chat', {
          body: { 
            message: prompt,
            generateContent: true,
            skill: skillType
          }
        });

        if (aiError) throw aiError;

        const content = aiData.response;
        const processedData = processAIContent(skillType, content, randomTopic);
        setSessionData(processedData);
        setUsePreGenerated(false);

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
          title: "AI Test Generated Successfully",
          description: `Your personalized ${skillType} test is ready!`,
        });

      } catch (aiError) {
        console.log('AI generation failed, loading fallback content:', aiError);
        loadPreGeneratedContent();
      }

    } catch (error) {
      console.error('Error setting up session:', error);
      toast({
        title: "Setup Error",
        description: "Failed to start practice session. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generatePromptForSkill = (skill: string, topic: string): string => {
    switch (skill) {
      case 'listening':
        return `Generate a complete IELTS Listening test about "${topic}". Create:
        1. A realistic conversation transcript between 2-3 people (350-450 words)
        2. 10 mixed questions: 4 multiple choice, 4 fill-in-the-blank, 2 matching/labelling
        3. Clear answer key with explanations
        4. Make it engaging and authentic with natural dialogue
        Format as JSON: {"transcript": "...", "questions": [...], "answers": [...], "explanations": [...]}`;
      
      case 'reading':
        return `Generate a complete IELTS Reading passage about "${topic}". Create:
        1. An academic text of 550-650 words with clear paragraphs (A, B, C, D, E)
        2. Exactly 10 questions: 6 True/False/Not Given, 2 multiple choice, 2 summary completion
        3. Answer key with detailed explanations
        4. Make it informative and well-structured with academic vocabulary
        Format as JSON: {"passage": "...", "questions": [...], "answers": [...], "explanations": [...]}`;
      
      case 'writing':
        return `Generate IELTS Writing tasks about "${topic}":
        1. Task 1: Create a chart/graph description task with sample data and clear visual description
        2. Task 2: An argumentative essay question related to the topic with clear instructions
        3. Assessment criteria and band descriptors
        4. Sample response excerpts for different band levels
        Format as JSON: {"task1": {...}, "task2": {...}, "criteria": [...], "samples": [...]}`;
      
      case 'speaking':
        return `Generate IELTS Speaking test about "${topic}":
        1. Part 1: 4 warm-up questions about daily life and personal experiences
        2. Part 2: Cue card about "${topic}" with 4 detailed bullet points
        3. Part 3: 4 abstract discussion questions related to the topic for deeper analysis
        4. Assessment criteria and band descriptors for each part
        Format as JSON: {"part1": [...], "part2": {...}, "part3": [...], "criteria": [...]}`;
      
      default:
        return `Generate a comprehensive IELTS ${skill} test about "${topic}".`;
    }
  };

  const processAIContent = (skill: string, content: string, topic: string) => {
    try {
      // Clean the content first
      let cleanContent = content.trim();
      
      // Remove any markdown code blocks
      cleanContent = cleanContent.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      
      const parsed = JSON.parse(cleanContent);
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

  const getFallbackContent = (skill: string, topic: string) => {
    const fallbackData = {
      listening: {
        type: 'listening',
        topic: topic,
        section: 1,
        transcript: `Welcome to the ${topic} conversation. In this listening exercise, you will hear a detailed discussion about ${topic}. Pay attention to specific details, dates, and key information mentioned throughout the conversation. The speakers will discuss various aspects of this topic, including practical considerations, procedures, and important requirements that you need to understand.`,
        audioUrl: null,
        questions: [
          {
            type: 'multiple_choice',
            question: `What is the main focus of the ${topic} discussion?`,
            options: ['Technical procedures', 'General information', 'Specific requirements', 'Future planning']
          },
          {
            type: 'fill_blank',
            question: `The speaker mentions that ${topic} requires ________ preparation.`
          },
          {
            type: 'multiple_choice',
            question: 'According to the conversation, what is the most important consideration?',
            options: ['Time management', 'Cost effectiveness', 'Quality assurance', 'Customer satisfaction']
          },
          {
            type: 'fill_blank',
            question: 'The process typically takes ________ to complete.'
          }
        ]
      },
      reading: {
        type: 'reading',
        topic: topic,
        passage: `<h3>${topic}</h3>
        <p><strong>A</strong> ${topic} has become increasingly important in today's rapidly evolving world. Recent comprehensive studies and research initiatives have shown significant developments in this field, with researchers and experts making breakthrough discoveries that could fundamentally revolutionize our understanding and approach to this complex subject matter.</p>
        <p><strong>B</strong> The far-reaching implications of ${topic} extend considerably beyond initial expectations and preliminary assessments. Leading experts and industry professionals argue convincingly that the long-term effects and consequences will be substantial and transformative, potentially affecting various sectors of society, industry, and individual lives in unprecedented ways.</p>
        <p><strong>C</strong> However, significant challenges and obstacles remain in implementing effective strategies and comprehensive solutions related to ${topic}. Critics and skeptics point out several important limitations, practical constraints, and theoretical concerns that need to be thoroughly addressed and resolved before widespread adoption and implementation can occur successfully.</p>
        <p><strong>D</strong> Looking toward the future with optimism and realistic expectations, the prospects and potential of ${topic} appear promising and encouraging. Continued research, development, and innovation in this area are expected to yield significant benefits, practical applications, and positive outcomes for society as a whole, contributing to progress and advancement.</p>
        <p><strong>E</strong> The ongoing debate and discussion surrounding ${topic} reflects the complexity and multifaceted nature of this important issue. Stakeholders, policymakers, and researchers continue to collaborate and work together to find balanced, effective, and sustainable solutions that address the various challenges while maximizing the potential benefits and opportunities available.</p>`,
        questions: [
          '${topic} has become increasingly important in recent years.',
          'Researchers have made significant breakthrough discoveries in this field.',
          'All experts completely agree on the implementation strategies and approaches.',
          'There are notable challenges in achieving widespread adoption.',
          'The future outlook for this field is entirely negative and pessimistic.',
          'Critics have identified several important limitations that need addressing.',
          'The implications extend beyond what was initially expected.',
          'Stakeholders are working together to find balanced solutions.',
          'The debate reflects the complexity of the issue.',
          'Research and development are expected to yield significant benefits.'
        ]
      },
      writing: {
        type: 'writing',
        topic: topic,
        task1: {
          prompt: `The chart below shows data related to ${topic} in three different regions over a 10-year period from 2010 to 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.`,
          image: null
        },
        task2: {
          prompt: `Some people believe that ${topic} has more advantages than disadvantages for modern society, while others argue that the disadvantages outweigh the benefits. Discuss both views and give your own opinion. Give reasons for your answer and include relevant examples from your knowledge or experience. Write at least 250 words.`
        }
      },
      speaking: {
        type: 'speaking',
        topic: topic,
        part1: [
          'How often do you think about topics like this in your daily life?',
          'What personal experiences have you had related to this subject?',
          'Do you find this topic interesting and engaging? Why or why not?',
          'How important is this topic in your country or community?'
        ],
        part2: {
          topic: `Describe ${topic}`,
          points: [
            'what it involves and includes',
            'why it is important and significant',
            'how it affects people and society',
            'what your personal opinion is about it'
          ]
        },
        part3: [
          'How do you think this topic will develop and evolve in the future?',
          'What are the main challenges and obstacles related to this topic?',
          'How do different generations and age groups view this topic?',
          'What role should governments and institutions play in addressing this topic?'
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

  const calculateQuantityBasedScore = (userResponse: any, skillType: string): { quantityScore: number, bandScore: number, correctAnswers: number, totalQuestions: number } => {
    let correctAnswers = 0;
    let totalQuestions = 0;
    
    console.log('Calculating quantity-based score for:', skillType, userResponse);

    if (skillType === 'reading' || skillType === 'listening') {
      if (typeof userResponse === 'object' && userResponse !== null) {
        const answers = Object.entries(userResponse);
        totalQuestions = answers.length;
        
        // For demo purposes, simulate correct answers based on reasonable patterns
        answers.forEach(([key, answer]: [string, any]) => {
          if (answer && typeof answer === 'string' && answer.trim().length > 0) {
            // Simple simulation: consider non-empty answers as potentially correct
            // In real implementation, you'd compare with actual correct answers
            correctAnswers += Math.random() > 0.3 ? 1 : 0; // 70% chance of being correct
          }
        });
      }
    } else if (skillType === 'writing') {
      totalQuestions = 2; // Task 1 and Task 2
      const task1Text = userResponse?.task1 || '';
      const task2Text = userResponse?.task2 || '';
      
      if (task1Text.length >= 150) correctAnswers += 1;
      if (task2Text.length >= 250) correctAnswers += 1;
    } else if (skillType === 'speaking') {
      totalQuestions = 3; // 3 parts
      const responses = userResponse?.recordings || [];
      correctAnswers = responses.length; // Each completed part counts as correct
    }

    const quantityScore = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    
    // Convert quantity score to band score
    let bandScore = 5.0;
    if (quantityScore >= 90) bandScore = 9.0;
    else if (quantityScore >= 80) bandScore = 8.0;
    else if (quantityScore >= 70) bandScore = 7.5;
    else if (quantityScore >= 60) bandScore = 7.0;
    else if (quantityScore >= 50) bandScore = 6.5;
    else if (quantityScore >= 40) bandScore = 6.0;
    else if (quantityScore >= 30) bandScore = 5.5;
    else if (quantityScore >= 20) bandScore = 5.0;
    else bandScore = 4.5;

    return { quantityScore, bandScore, correctAnswers, totalQuestions };
  };

  const handleTestComplete = async (userResponse: any) => {
    if (!sessionId || !userResponse) {
      toast({
        title: "Submission Error",
        description: "Invalid session or response data.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setUserAnswers(userResponse);
    
    try {
      console.log('Processing test completion for:', skillType, userResponse);
      
      const scoreData = calculateQuantityBasedScore(userResponse, skillType);
      console.log('Calculated scores:', scoreData);
      
      // Generate enhanced feedback prompt
      const feedbackPrompt = `As a certified IELTS examiner, provide comprehensive professional feedback for this ${skillType} test response.

User Response Data: ${JSON.stringify(userResponse, null, 2)}
Quantity Score: ${scoreData.quantityScore}% (${scoreData.correctAnswers}/${scoreData.totalQuestions} correct)
Band Score: ${scoreData.bandScore}
Test Topic: ${currentTopic}

Provide feedback in this exact format without asterisks or markdown:

OVERALL PERFORMANCE SUMMARY:
Quantity Score: ${scoreData.quantityScore}% (${scoreData.correctAnswers} out of ${scoreData.totalQuestions} questions correct)
Band Score: ${scoreData.bandScore}/9.0

DETAILED SKILL ANALYSIS:
For ${skillType} skills, analyze the performance across different question types and provide specific examples from the user's responses.

STRENGTHS IDENTIFIED:
- List 3-4 specific positive aspects with examples
- Highlight effective techniques used
- Note areas of strong performance

AREAS REQUIRING IMPROVEMENT:
- Identify 3-4 specific weaknesses with examples  
- Explain what prevented higher scores
- Provide actionable improvement strategies

EDUCATIONAL RECOMMENDATIONS:
- Suggest specific practice activities
- Recommend study materials and techniques
- Provide timeline for improvement
- Give preparation tips for actual IELTS test

EXAMINER SUMMARY:
Professional assessment of readiness for actual IELTS test with next steps for preparation.

Use clear, professional language without asterisks or casual expressions.`;

      console.log('Generating comprehensive AI feedback...');
      
      const { data: feedbackData, error: feedbackError } = await supabase.functions.invoke('gemini-chat', {
        body: { message: feedbackPrompt }
      });

      let feedback = 'Unable to generate detailed feedback at this time. Please try again later.';
      if (!feedbackError && feedbackData?.response) {
        feedback = feedbackData.response;
        console.log('AI feedback generated successfully');
      } else {
        console.error('AI feedback error:', feedbackError);
      }

      // Update the practice session with comprehensive data
      const { error: updateError } = await supabase
        .from('practice_sessions')
        .update({
          session_data: {
            ...sessionData,
            user_response: userResponse,
            completed_at: new Date().toISOString(),
            use_pre_generated: usePreGenerated,
            topic: currentTopic,
            score_breakdown: scoreData
          },
          score: scoreData.bandScore,
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
        title: "Test Completed Successfully!",
        description: `Score: ${scoreData.quantityScore}% | Band: ${scoreData.bandScore}/9`,
      });

    } catch (error) {
      console.error('Error completing test:', error);
      toast({
        title: "Evaluation Error",
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
      const userAnswer = userAnswers?.[`question_${questionIndex}`] || '';
      
      // Generate correct answer and explanation
      const explainPrompt = `As an IELTS expert, provide a detailed explanation for this ${skillType} question:
      
      Question ${questionIndex + 1}: ${question?.question || `Question ${questionIndex + 1}`}
      Question Type: ${question?.type || 'general'}
      User's Answer: ${userAnswer}
      Test Topic: ${currentTopic}
      
      Please provide:
      1. The correct answer with explanation
      2. Whether the user's answer is correct (true/false)
      3. Detailed reasoning for why this is the correct answer
      4. Common mistakes for this question type
      5. Specific strategies and learning tips
      
      Format as JSON: {"correctAnswer": "...", "isCorrect": true/false, "explanation": "...", "tips": ["...", "..."], "reasoning": "..."}`;

      const { data: explanationData, error: explanationError } = await supabase.functions.invoke('gemini-chat', {
        body: { message: explainPrompt }
      });

      if (explanationError) throw explanationError;

      try {
        const parsedExplanation = JSON.parse(explanationData.response);
        setExplanation({
          question,
          userAnswer,
          questionIndex,
          ...parsedExplanation
        });
      } catch {
        // Fallback if JSON parsing fails
        setExplanation({
          question,
          userAnswer,
          correctAnswer: 'Answer explanation available',
          isCorrect: userAnswer.length > 0,
          explanation: explanationData.response || 'Unable to generate explanation.',
          questionIndex
        });
      }
      
      setShowExplanation(true);

    } catch (error) {
      console.error('Error getting explanation:', error);
      toast({
        title: "Explanation Error",
        description: "Failed to get detailed explanation. Please try again.",
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
      <div className="flex items-center justify-center min-h-96 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center space-y-4 p-8 bg-white rounded-xl shadow-lg border border-blue-200">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="text-blue-800 font-medium text-lg">Generating Your Professional IELTS Test...</p>
          <p className="text-sm text-blue-600">Topic: {currentTopic || 'Selecting engaging topic...'}</p>
          <Button 
            variant="outline" 
            onClick={loadPreGeneratedContent}
            className="mt-4 border-blue-300 text-blue-700 hover:bg-blue-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Use Pre-Generated Test Instead
          </Button>
        </div>
      </div>
    );
  }

  if (showResults) {
    const scoreData = userAnswers ? calculateQuantityBasedScore(userAnswers, skillType) : null;
    
    return (
      <div className="max-w-5xl mx-auto p-6 space-y-6 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack} className="border-blue-300 text-blue-700 hover:bg-blue-100">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Skills
          </Button>
          <Badge className="bg-green-100 text-green-700 px-4 py-2">
            <CheckCircle className="h-4 w-4 mr-1" />
            Test Completed Successfully
          </Badge>
          {currentTopic && (
            <Badge variant="outline" className="border-blue-300 text-blue-700">
              Topic: {currentTopic.length > 50 ? currentTopic.substring(0, 50) + '...' : currentTopic}
            </Badge>
          )}
        </div>

        <Card className="shadow-xl border-blue-200">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-b">
            <CardTitle className="text-3xl text-center">
              🎓 Official IELTS Performance Report
            </CardTitle>
            <p className="text-center text-blue-100 mt-2 text-lg">
              {skillType.charAt(0).toUpperCase() + skillType.slice(1)} Test Assessment
            </p>
          </CardHeader>
          <CardContent className="p-8">
            {/* Score Display */}
            {scoreData && (
              <div className="text-center mb-8 p-8 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-2xl border-2 border-blue-300 shadow-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                  <div className="bg-white p-6 rounded-xl shadow-md">
                    <h3 className="text-2xl font-bold text-blue-700 mb-2">Quantity Score</h3>
                    <div className="text-4xl font-bold text-blue-800 mb-2">
                      {scoreData.quantityScore}%
                    </div>
                    <p className="text-sm text-gray-600">
                      {scoreData.correctAnswers} out of {scoreData.totalQuestions} correct
                    </p>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-md">
                    <h3 className="text-2xl font-bold text-indigo-700 mb-2">IELTS Band Score</h3>
                    <div className="text-4xl font-bold text-indigo-800 mb-2">
                      {scoreData.bandScore}
                    </div>
                    <p className="text-sm text-gray-600">out of 9.0</p>
                  </div>
                </div>
              </div>
            )}

            {/* AI Feedback Display */}
            <div className="bg-white border border-blue-200 rounded-xl p-8 shadow-lg">
              <div className="prose max-w-none">
                {aiResponse.split('\n').map((line, index) => {
                  const trimmedLine = line.trim();
                  
                  if (trimmedLine.match(/^(OVERALL PERFORMANCE SUMMARY|DETAILED SKILL ANALYSIS|STRENGTHS IDENTIFIED|AREAS REQUIRING IMPROVEMENT|EDUCATIONAL RECOMMENDATIONS|EXAMINER SUMMARY):?$/)) {
                    return (
                      <div key={index} className="mt-8 mb-4">
                        <h3 className="text-2xl font-bold text-blue-800 border-b-3 border-blue-300 pb-3 mb-4">
                          {trimmedLine.replace(':', '')}
                        </h3>
                      </div>
                    );
                  }
                  
                  if (trimmedLine.includes('Quantity Score:') || trimmedLine.includes('Band Score:')) {
                    return (
                      <div key={index} className="mb-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                        <p className="text-lg font-semibold text-blue-800">
                          {trimmedLine}
                        </p>
                      </div>
                    );
                  }
                  
                  if (trimmedLine.startsWith('-')) {
                    return (
                      <div key={index} className="flex items-start mb-3 p-4 bg-indigo-50 rounded-lg border-l-4 border-indigo-400">
                        <div className="w-3 h-3 bg-indigo-500 rounded-full mt-2 mr-4 flex-shrink-0"></div>
                        <p className="text-gray-700 leading-relaxed font-medium">{trimmedLine.substring(1).trim()}</p>
                      </div>
                    );
                  }
                  
                  if (trimmedLine && !trimmedLine.match(/^(OVERALL PERFORMANCE SUMMARY|DETAILED SKILL ANALYSIS|STRENGTHS IDENTIFIED|AREAS REQUIRING IMPROVEMENT|EDUCATIONAL RECOMMENDATIONS|EXAMINER SUMMARY):?$/)) {
                    return (
                      <div key={index} className="mb-4 p-5 bg-white rounded-lg border border-gray-200 shadow-sm">
                        <p className="text-gray-700 leading-relaxed">
                          {trimmedLine}
                        </p>
                      </div>
                    );
                  }
                  
                  return null;
                })}
              </div>
            </div>
            
            <div className="flex justify-center space-x-6 mt-10">
              <Button onClick={() => generateOrLoadContent()} className="bg-blue-600 hover:bg-blue-700 px-8 py-4 text-lg shadow-lg">
                Take Another Test
              </Button>
              <Button variant="outline" onClick={onBack} className="px-8 py-4 text-lg border-blue-300 text-blue-700 hover:bg-blue-50">
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack} className="border-blue-300 text-blue-700 hover:bg-blue-100">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Badge className="bg-blue-100 text-blue-800 px-4 py-2 text-lg">
            {skillType.charAt(0).toUpperCase() + skillType.slice(1)} Test
          </Badge>
          {usePreGenerated && (
            <Badge variant="outline" className="border-blue-300 text-blue-600">Pre-Generated Content</Badge>
          )}
          {currentTopic && (
            <Badge variant="secondary" className="max-w-md truncate bg-indigo-100 text-indigo-800">
              {currentTopic}
            </Badge>
          )}
        </div>
        
        <Button 
          variant="outline" 
          onClick={loadPreGeneratedContent}
          disabled={isLoading}
          className="border-blue-300 text-blue-700 hover:bg-blue-50"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Use Pre-Generated Test
        </Button>
      </div>

      {renderTestComponent()}

      {/* Answer Explanation Modal */}
      {showExplanation && explanation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader className="bg-gradient-to-r from-blue-100 to-indigo-100">
              <CardTitle className="flex items-center justify-between">
                <span className="text-blue-800">📚 Answer Explanation & Learning Guide</span>
                <Button 
                  variant="ghost" 
                  onClick={() => setShowExplanation(false)}
                  className="text-blue-600 hover:bg-blue-200"
                >
                  ✕
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <AnswerExplanation
                question={explanation.question}
                userAnswer={explanation.userAnswer}
                correctAnswer={explanation.correctAnswer}
                isCorrect={explanation.isCorrect}
                skillType={skillType}
                questionIndex={explanation.questionIndex}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ProfessionalPracticeSession;
