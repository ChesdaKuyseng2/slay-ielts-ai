import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, BookOpen, Headphones, Mic, PenTool, Trophy, Star, CheckCircle, XCircle, Play, Pause, Volume2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import AnswerExplanation from './ielts/AnswerExplanation';

interface PracticeSessionProps {
  skill: string;
  duration: number;
  onComplete: () => void;
}

interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  type?: string;
  audioUrl?: string;
}

interface Feedback {
  isCorrect: boolean;
  explanation: string;
}

const generateFallbackQuestions = (skill: string): Question[] => {
  const baseQuestions = [
    {
      id: 1,
      text: `What is the main focus of ${skill} skills in IELTS?`,
      options: ['Grammar accuracy', 'Vocabulary range', 'Communication effectiveness', 'All of the above'],
      correctAnswer: 'All of the above',
      explanation: `${skill} skills in IELTS require a combination of grammar accuracy, vocabulary range, and communication effectiveness.`
    },
    {
      id: 2,
      text: `Which strategy is most effective for ${skill} practice?`,
      options: ['Regular practice', 'Memorizing answers', 'Speed over accuracy', 'Avoiding difficult topics'],
      correctAnswer: 'Regular practice',
      explanation: 'Regular, consistent practice is the most effective way to improve any IELTS skill.'
    },
    {
      id: 3,
      text: `How should you approach ${skill} questions in the IELTS test?`,
      options: ['Rush through quickly', 'Read instructions carefully', 'Skip difficult questions', 'Guess randomly'],
      correctAnswer: 'Read instructions carefully',
      explanation: 'Always read instructions carefully to understand exactly what is being asked.'
    },
    {
      id: 4,
      text: `What is the recommended time management strategy for ${skill}?`,
      options: ['Spend equal time on all questions', 'Allocate time based on marks', 'Finish as quickly as possible', 'Focus only on easy questions'],
      correctAnswer: 'Allocate time based on marks',
      explanation: 'Time should be allocated based on the marks available for each question or section.'
    },
    {
      id: 5,
      text: `Which skill is most important for ${skill} success?`,
      options: ['Perfect grammar', 'Understanding context', 'Fast reading', 'Memorized vocabulary'],
      correctAnswer: 'Understanding context',
      explanation: 'Understanding the context and meaning is crucial for success in any IELTS skill area.'
    }
  ];

  // Add skill-specific audio URLs for listening
  if (skill === 'listening') {
    return baseQuestions.map(q => ({
      ...q,
      audioUrl: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBz2b3ey/cCUBK5HL7teMNAkYaL/s1KhXGw5Iq+Xyr2ciAzhq0/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBz2b3e'
    }));
  }

  return baseQuestions;
};

const loadPreGeneratedContent = async (skill: string) => {
  console.log(`Loading pre-generated content for ${skill}`);
  
  try {
    const { data, error } = await supabase
      .from('content_items')
      .select('*')
      .eq('skill_type', skill.toLowerCase())
      .eq('is_active', true)
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (data && data.content && typeof data.content === 'object') {
      console.log('Found pre-generated content:', data.content);
      return data.content;
    }

    console.log(`No pre-generated content found for ${skill}, using fallback`);
    return null;
  } catch (error) {
    console.error(`Error loading pre-generated content for ${skill}:`, error);
    return null;
  }
};

const ProfessionalPracticeSession: React.FC<PracticeSessionProps> = ({ skill, duration, onComplete }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [isSessionActive, setIsSessionActive] = useState(true);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const [content, setContent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      setIsLoading(true);
      try {
        const preGeneratedContent = await loadPreGeneratedContent(skill);
        
        if (preGeneratedContent && 
            typeof preGeneratedContent === 'object' && 
            'questions' in preGeneratedContent &&
            Array.isArray(preGeneratedContent.questions)) {
          console.log('Using pre-generated questions:', preGeneratedContent.questions);
          setContent(preGeneratedContent);
          setQuestions(preGeneratedContent.questions);
        } else {
          console.log('Using fallback questions for skill:', skill);
          const fallbackQuestions = generateFallbackQuestions(skill);
          setQuestions(fallbackQuestions);
          setContent({ questions: fallbackQuestions });
        }
      } catch (error) {
        console.error("Failed to load content:", error);
        console.log('Using fallback questions due to error');
        const fallbackQuestions = generateFallbackQuestions(skill);
        setQuestions(fallbackQuestions);
        setContent({ questions: fallbackQuestions });
        
        toast({
          title: "Using practice questions",
          description: "Loading practice questions for your session.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, [skill, toast]);

  useEffect(() => {
    if (isSessionActive && timeRemaining > 0) {
      timerRef.current = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
    } else if (timeRemaining === 0) {
      handleSessionComplete();
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [timeRemaining, isSessionActive]);

  const handleAnswerSelection = (answer: string) => {
    const updatedAnswers = [...userAnswers];
    updatedAnswers[currentQuestionIndex] = answer;
    setUserAnswers(updatedAnswers);
  };

  const handleSubmitAnswer = () => {
    if (!questions[currentQuestionIndex]) {
      console.warn(`No question at index ${currentQuestionIndex}`);
      return;
    }
  
    const correctAnswer = questions[currentQuestionIndex].correctAnswer;
    const isCorrect = userAnswers[currentQuestionIndex] === correctAnswer;
    const explanation = questions[currentQuestionIndex].explanation || "No explanation provided.";
  
    setFeedback({
      isCorrect: isCorrect,
      explanation: explanation,
    });
  };

  const handleNextQuestion = () => {
    setFeedback(null);
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleSessionComplete();
    }
  };

  const handlePauseResumeSession = () => {
    setIsSessionActive(!isSessionActive);
    if (!isSessionActive) {
      timerRef.current = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    }
  };

  const handleSessionComplete = () => {
    setIsSessionActive(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    toast({
      title: "Practice Session Complete",
      description: "You have completed the practice session.",
    });
    onComplete();
  };

  const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isAudioPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsAudioPlaying(!isAudioPlaying);
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.addEventListener('ended', () => {
        setIsAudioPlaying(false);
      });
    }
  
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('ended', () => {
          setIsAudioPlaying(false);
        });
      }
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading {skill} practice questions...</p>
        </div>
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No questions available for {skill}.</p>
          <Button onClick={onComplete} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Professional Practice Session - {skill}</CardTitle>
        <CardDescription>Answer the question below.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>Time Remaining: {formatTime(timeRemaining)}</span>
          </div>
          <Badge variant={isSessionActive ? "default" : "secondary"}>
            {isSessionActive ? "Active" : "Paused"}
          </Badge>
        </div>
        <Progress value={((duration - timeRemaining) / duration) * 100} />

        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Question {currentQuestionIndex + 1}/{questions.length}</h3>
          <p>{currentQuestion.text}</p>
          {skill === 'listening' && currentQuestion.audioUrl && (
            <div className="flex items-center space-x-3 mt-2">
              <button onClick={toggleAudio} className="p-2 rounded-full bg-secondary hover:bg-secondary/80">
                {isAudioPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </button>
              <audio ref={audioRef} src={currentQuestion.audioUrl} style={{ display: 'none' }} />
              <Volume2 className="h-5 w-5 text-gray-500" />
            </div>
          )}
          <div className="grid gap-2">
            {currentQuestion.options.map((option, index) => (
              <Button
                key={index}
                variant={userAnswers[currentQuestionIndex] === option ? "default" : "outline"}
                onClick={() => handleAnswerSelection(option)}
              >
                {option}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex justify-between">
          <Button
            variant="secondary"
            onClick={handlePauseResumeSession}
          >
            {isSessionActive ? "Pause Session" : "Resume Session"}
          </Button>
          {feedback ? (
            <Button onClick={handleNextQuestion}>
              Next Question
            </Button>
          ) : (
            <Button onClick={handleSubmitAnswer} disabled={!userAnswers[currentQuestionIndex]}>
              Submit Answer
            </Button>
          )}
        </div>

        {feedback && (
          <AnswerExplanation 
            question={currentQuestion}
            userAnswer={userAnswers[currentQuestionIndex]}
            correctAnswer={currentQuestion.correctAnswer}
            isCorrect={feedback.isCorrect} 
            skillType={skill}
            questionIndex={currentQuestionIndex}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default ProfessionalPracticeSession;
