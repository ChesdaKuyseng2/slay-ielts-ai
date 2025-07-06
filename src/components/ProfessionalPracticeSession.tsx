import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, BookOpen, Headphones, Mic, PenTool, Trophy, Star, CheckCircle, XCircle, Play, Pause, Volume2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AnswerExplanation } from './ielts/AnswerExplanation';

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
}

interface Feedback {
  isCorrect: boolean;
  explanation: string;
}

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

    if (data && data.content) {
      return data.content;
    }

    // Fallback to generate new content if none exists
    console.log(`No pre-generated content found for ${skill}, generating new...`);
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
        if (preGeneratedContent) {
          setContent(preGeneratedContent);
          setQuestions(preGeneratedContent.questions || []);
        } else {
          // Fetch from API if no pre-generated content
          const response = await fetch(`/api/ielts/generate?skill=${skill}&count=5`);
          if (!response.ok) {
            throw new Error(`Failed to fetch questions: ${response.status}`);
          }
          const data = await response.json();
          setContent(data);
          setQuestions(data.questions);
        }
      } catch (error) {
        console.error("Failed to load content:", error);
        toast({
          title: "Error loading content",
          description: "Failed to load practice questions. Please try again.",
          variant: "destructive",
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
      // If resuming
      timerRef.current = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
    } else {
      // If pausing
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

  const currentQuestion = questions[currentQuestionIndex];

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
    return <div>Loading...</div>;
  }

  if (!currentQuestion) {
    return <div>No questions available.</div>;
  }

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
          <AnswerExplanation isCorrect={feedback.isCorrect} explanation={feedback.explanation} />
        )}
      </CardContent>
    </Card>
  );
};

export default ProfessionalPracticeSession;
