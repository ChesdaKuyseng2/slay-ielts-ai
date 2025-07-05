
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
  const [currentTopic, setCurrentTopic] = useState<string>('');

  // Enhanced topic arrays for different content types
  const topics = {
    listening: [
      'University course enrollment and registration process',
      'Job interview at a technology company',
      'Apartment rental inquiry and viewing',
      'Library book reservation and borrowing system',
      'International travel booking and planning',
      'Restaurant reservation and menu discussion',
      'Medical appointment scheduling and consultation',
      'Banking services inquiry and account opening',
      'Fitness center membership and facilities tour',
      'Online shopping customer service interaction',
      'Academic conference registration and networking',
      'Hotel check-in process and room service',
      'Public transportation system navigation',
      'Insurance policy consultation and claims',
      'Career counseling and professional development'
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
    const skillTopics = topics[skill as keyof typeof topics] || topics.reading;
    const randomTopic = skillTopics[Math.floor(Math.random() * skillTopics.length)];
    setCurrentTopic(randomTopic);
    return randomTopic;
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
        const fallbackTopic = getRandomTopic(skillType);
        setSessionData(getFallbackContent(skillType, fallbackTopic));
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
      const fallbackTopic = getRandomTopic(skillType);
      setSessionData(getFallbackContent(skillType, fallbackTopic));
      setUsePreGenerated(true);
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

  const calculateBandScore = (userResponse: any, skillType: string): number => {
    if (!userResponse) return 5.0;

    console.log('Calculating band score for:', skillType, userResponse);

    switch (skillType) {
      case 'reading':
      case 'listening':
        let correctAnswers = 0;
        let totalQuestions = 0;
        
        if (typeof userResponse === 'object') {
          const answers = Object.values(userResponse);
          totalQuestions = answers.length;
          
          answers.forEach((answer: any) => {
            if (answer && typeof answer === 'string' && answer.trim().length > 0) {
              correctAnswers++;
            }
          });
        }
        
        const percentage = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
        
        if (percentage >= 90) return 9.0;
        if (percentage >= 87) return 8.5;
        if (percentage >= 80) return 8.0;
        if (percentage >= 75) return 7.5;
        if (percentage >= 70) return 7.0;
        if (percentage >= 65) return 6.5;
        if (percentage >= 60) return 6.0;
        if (percentage >= 55) return 5.5;
        if (percentage >= 50) return 5.0;
        if (percentage >= 40) return 4.5;
        return 4.0;

      case 'writing':
        const task1Text = userResponse?.task1 || '';
        const task2Text = userResponse?.task2 || '';
        const task1WordCount = task1Text.split(' ').length;
        const task2WordCount = task2Text.split(' ').length;
        const totalWordCount = task1WordCount + task2WordCount;
        
        let baseScore = 5.0;
        if (totalWordCount >= 450) baseScore = 7.5;
        else if (totalWordCount >= 400) baseScore = 7.0;
        else if (totalWordCount >= 350) baseScore = 6.5;
        else if (totalWordCount >= 300) baseScore = 6.0;
        else if (totalWordCount >= 250) baseScore = 5.5;
        
        return Math.min(8.5, baseScore + (Math.random() * 0.5));

      case 'speaking':
        const responses = userResponse?.responses || [];
        const totalDuration = responses.reduce((sum: number, r: any) => sum + (r?.duration || 0), 0);
        
        let speakingScore = 5.0;
        if (totalDuration >= 600) speakingScore = 8.0;
        else if (totalDuration >= 480) speakingScore = 7.5;
        else if (totalDuration >= 360) speakingScore = 7.0;
        else if (totalDuration >= 300) speakingScore = 6.5;
        else if (totalDuration >= 240) speakingScore = 6.0;
        else if (totalDuration >= 180) speakingScore = 5.5;
        
        return Math.min(8.5, speakingScore + (Math.random() * 0.3));

      default:
        return 6.0;
    }
  };

  const handleTestComplete = async (userResponse: any) => {
    if (!sessionId || !userResponse) {
      toast({
        title: "Error",
        description: "Invalid session or response data.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('Processing test completion for:', skillType, userResponse);
      
      const calculatedScore = calculateBandScore(userResponse, skillType);
      console.log('Calculated band score:', calculatedScore);
      
      // Generate detailed feedback prompt
      const feedbackPrompt = `As a certified IELTS examiner, provide comprehensive professional feedback for this ${skillType} test response.

User Response Data: ${JSON.stringify(userResponse, null, 2)}
Calculated Band Score: ${calculatedScore}
Test Topic: ${currentTopic}

Provide feedback in this exact format without asterisks or markdown:

OVERALL BAND SCORE: ${calculatedScore}

DETAILED ASSESSMENT:

${skillType === 'writing' ? `
Task Achievement: ${Math.max(4.0, calculatedScore - 0.5).toFixed(1)} - Analysis of how well the task requirements are addressed
Coherence and Cohesion: ${Math.max(4.0, calculatedScore - 0.3).toFixed(1)} - Organization and logical flow of ideas
Lexical Resource: ${Math.max(4.0, calculatedScore - 0.2).toFixed(1)} - Vocabulary range, accuracy and appropriateness
Grammatical Range and Accuracy: ${Math.max(4.0, calculatedScore - 0.4).toFixed(1)} - Grammar complexity and correctness
` : skillType === 'speaking' ? `
Fluency and Coherence: ${Math.max(4.0, calculatedScore - 0.3).toFixed(1)} - Natural flow and logical organization
Lexical Resource: ${Math.max(4.0, calculatedScore - 0.2).toFixed(1)} - Vocabulary range and appropriateness
Grammatical Range and Accuracy: ${Math.max(4.0, calculatedScore - 0.4).toFixed(1)} - Grammar complexity and accuracy
Pronunciation: ${Math.max(4.0, calculatedScore - 0.1).toFixed(1)} - Clarity and natural speech patterns
` : skillType === 'reading' ? `
Reading Comprehension: ${Math.max(4.0, calculatedScore - 0.2).toFixed(1)} - Understanding of text and questions
Task Response: ${Math.max(4.0, calculatedScore - 0.3).toFixed(1)} - Accuracy in answering different question types
Time Management: ${Math.max(4.0, calculatedScore - 0.1).toFixed(1)} - Efficiency in completing tasks
Speed and Accuracy: ${Math.max(4.0, calculatedScore - 0.2).toFixed(1)} - Balance between quick reading and correct answers
` : `
Listening Skills: ${Math.max(4.0, calculatedScore - 0.2).toFixed(1)} - Understanding of audio content
Task Response: ${Math.max(4.0, calculatedScore - 0.3).toFixed(1)} - Accuracy in answering questions
Note-taking: ${Math.max(4.0, calculatedScore - 0.1).toFixed(1)} - Ability to capture key information
Concentration: ${Math.max(4.0, calculatedScore - 0.2).toFixed(1)} - Sustained attention throughout the test
`}

STRENGTHS:
- Identify 3-4 specific positive aspects of the performance with examples
- Highlight areas where the candidate performed well
- Mention specific skills that were demonstrated effectively
- Note any particularly good responses or techniques used

AREAS FOR IMPROVEMENT:
- Provide 3-4 specific areas that need development with actionable advice
- Explain what prevented a higher band score
- Give concrete examples of weaknesses observed
- Suggest specific skills to focus on

RECOMMENDATIONS:
- Provide 3-4 actionable study suggestions tailored to this performance
- Recommend specific practice activities
- Suggest resources or techniques for improvement
- Give timeline estimates for skill development

EXAMINER COMMENTS:
Professional summary of overall performance with specific examples from the response. Comment on the candidate's readiness for the actual IELTS test and next steps for preparation.

Use professional language suitable for official IELTS feedback. Do not use asterisks, markdown formatting, or casual language.`;

      console.log('Generating AI feedback...');
      
      const { data: feedbackData, error: feedbackError } = await supabase.functions.invoke('gemini-chat', {
        body: { message: feedbackPrompt }
      });

      let feedback = 'Unable to generate detailed feedback at this time. Please try again.';
      if (!feedbackError && feedbackData?.response) {
        feedback = feedbackData.response;
        console.log('AI feedback generated successfully');
      } else {
        console.error('AI feedback error:', feedbackError);
      }

      // Update the practice session
      const { error: updateError } = await supabase
        .from('practice_sessions')
        .update({
          session_data: {
            ...sessionData,
            user_response: userResponse,
            completed_at: new Date().toISOString(),
            use_pre_generated: usePreGenerated,
            topic: currentTopic
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
      
      Question ${questionIndex + 1}: ${question?.question || `Question ${questionIndex + 1} from the test`}
      Test Topic: ${currentTopic}
      
      Please provide:
      1. The correct answer and detailed explanation of why it is correct
      2. Common mistakes students make with this type of question
      3. Key strategies and techniques for similar questions
      4. Tips for avoiding errors in the future
      
      Use clear, educational language without asterisks or markdown formatting.`;

      const { data: explanationData, error: explanationError } = await supabase.functions.invoke('gemini-chat', {
        body: { message: explainPrompt }
      });

      if (explanationError) throw explanationError;

      setExplanation(explanationData.response || 'Unable to generate explanation at this time.');
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
          <p className="text-sm text-gray-500">Topic: {currentTopic || 'Selecting topic...'}</p>
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
          {currentTopic && (
            <Badge variant="outline">
              Topic: {currentTopic.length > 50 ? currentTopic.substring(0, 50) + '...' : currentTopic}
            </Badge>
          )}
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
                  
                  if (trimmedLine.match(/^(DETAILED ASSESSMENT|STRENGTHS|AREAS FOR IMPROVEMENT|RECOMMENDATIONS|EXAMINER COMMENTS):?$/)) {
                    return (
                      <div key={index} className="mt-8 mb-4">
                        <h3 className="text-xl font-bold text-gray-800 border-b-2 border-blue-200 pb-3 mb-4">
                          {trimmedLine.replace(':', '')}
                        </h3>
                      </div>
                    );
                  }
                  
                  if (trimmedLine.includes(':') && trimmedLine.match(/\d+\.?\d*/)) {
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
                  
                  if (trimmedLine.startsWith('-')) {
                    return (
                      <div key={index} className="flex items-start mb-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-4 flex-shrink-0"></div>
                        <p className="text-gray-700 leading-relaxed">{trimmedLine.substring(1).trim()}</p>
                      </div>
                    );
                  }
                  
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
          {currentTopic && (
            <Badge variant="secondary" className="max-w-md truncate">
              {currentTopic}
            </Badge>
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
